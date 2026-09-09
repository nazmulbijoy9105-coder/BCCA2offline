import { sha256 } from "@noble/hashes/sha2.js";
import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";

const registry = new DevelopmentProcedureRegistry();

/**
 * P8-11: Procedure Corpus Hashing.
 * 
 * Deterministically hashes the procedural rules registry using SHA-256.
 * Ensures that procedural rules (jurisdiction, fees, prerequisites) 
 * have not been tampered with between deployments.
 */

function serializeRules(): string {
  const rules = registry.getRules();
  // Sort by ruleId to ensure deterministic order
  const sortedRules = [...rules].sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  return JSON.stringify(sortedRules, (key, value) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((acc, k) => {
        (acc as Record<string, unknown>)[k] = (value as Record<string, unknown>)[k];
        return acc;
      }, {} as Record<string, unknown>);
    }
    return value;
  });
}

export function getProcedureCorpusHash(): string {
  const serialized = serializeRules();

  return Array.from(
    sha256(new TextEncoder().encode(serialized)),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Hard fail-closed guard. Verifies the runtime procedure hash matches expected.
 */
export function assertProcedureCorpusHash(expectedHash: string): void {
  const actualHash = getProcedureCorpusHash();
  if (actualHash !== expectedHash) {
    throw new Error(`Procedure Corpus Hash Mismatch: Expected ${expectedHash}, but calculated ${actualHash}. Procedural rules may have been tampered with.`);
  }
}
