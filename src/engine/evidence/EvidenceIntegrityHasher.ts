import { createHash } from "node:crypto";

/**
 * P7-08: Evidence Integrity Hashing.
 * 
 * Deterministically hashes an array of facts to ensure the evidence
 * payload is not tampered with between extraction and evaluation.
 */

export type HashableFact = {
  factId: string;
  predicate: string;
  object?: string | null;
  truth?: string | null;
  eventDate?: string | null;
};

/**
 * Sorts and serializes facts deterministically before hashing.
 */
function serializeFacts(facts: readonly HashableFact[]): string {
  // Deep copy and sort by factId to ensure order doesn't affect hash
  const sortedFacts = [...facts].map(f => ({ 
    factId: f.factId, 
    predicate: f.predicate, 
    object: f.object ?? null, 
    truth: f.truth ?? null, 
    eventDate: f.eventDate ?? null 
  })).sort((a, b) => a.factId.localeCompare(b.factId));

  return JSON.stringify(sortedFacts);
}

/**
 * Generates a SHA-256 hash of the evidence payload.
 */
export function getEvidenceHash(facts: readonly HashableFact[]): string {
  const serialized = serializeFacts(facts);
  return createHash("sha256").update(serialized).digest("hex");
}

/**
 * Hard fail-closed guard. Verifies that the runtime evidence hash 
 * matches the expected hash captured at extraction time.
 */
export function assertEvidenceIntegrity(
  facts: readonly HashableFact[],
  expectedHash: string
): void {
  const actualHash = getEvidenceHash(facts);
  if (actualHash !== expectedHash) {
    throw new Error(`Evidence Integrity Violation: Expected hash ${expectedHash}, but calculated ${actualHash}. Evidence may have been tampered with.`);
  }
}
