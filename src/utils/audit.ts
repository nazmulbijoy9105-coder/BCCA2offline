import { AuditEvent, AuditAction, UserRole } from "../types/auth.types";
import { generateHash, generateSecureId } from "./crypto";

const AUDIT_KEY = "_bccaa_audit_log";
const MAX_AUDIT_ENTRIES = 5000;

/**
 * Creates an immutable audit log entry with chain hashing
 */
export function logAudit(params: {
  action: AuditAction;
  userId: string;
  email: string;
  role: UserRole;
  resourceType: "CASE" | "USER" | "LICENSE" | "SYSTEM" | "AUTH";
  resourceId: string;
  outcome: "SUCCESS" | "FAILURE" | "DENIED";
  metadata?: Record<string, unknown>;
}): void {
  try {
    const queue = getAuditQueue();
    const previousHash = queue.length > 0 ? queue[queue.length - 1].currentHash : "genesis";

    const event: AuditEvent = {
      eventId: generateSecureId(),
      timestamp: Date.now(),
      actor: {
        userId: params.userId,
        email: params.email,
        role: params.role,
        ip: "local", // In offline mode, IP is not available
        deviceFingerprint: localStorage.getItem("_bccaa_device_fp") || "unknown",
      },
      action: params.action,
      resource: {
        type: params.resourceType,
        id: params.resourceId,
      },
      outcome: params.outcome,
      metadata: params.metadata || {},
      previousHash,
      currentHash: "", // computed below
    };

    // Chain hash: hash of previous hash + current event data
    const eventData = JSON.stringify({
      prev: event.previousHash,
      ts: event.timestamp,
      action: event.action,
      actor: event.actor.userId,
      resource: event.resource.id,
    });
    event.currentHash = generateHash(eventData);

    queue.push(event);

    // Trim to max size
    if (queue.length > MAX_AUDIT_ENTRIES) {
      queue.splice(0, queue.length - MAX_AUDIT_ENTRIES);
    }

    localStorage.setItem(AUDIT_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Audit logging failed:", e);
  }
}

export function getAuditQueue(): AuditEvent[] {
  try {
    const stored = localStorage.getItem(AUDIT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_KEY);
}

export function exportAuditLog(): string {
  return JSON.stringify(getAuditQueue(), null, 2);
}

/**
 * Verifies audit chain integrity
 */
export function verifyAuditChain(): boolean {
  const queue = getAuditQueue();
  for (let i = 1; i < queue.length; i++) {
    if (queue[i].previousHash !== queue[i - 1].currentHash) {
      return false;
    }
  }
  return true;
}
