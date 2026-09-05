import { createHash } from "node:crypto";
import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";

/**
 * P6-12: Legal Corpus Hashing.
 * 
 * Deterministically hashes the legal corpus using SHA-256.
 * Allows mathematical proof that the underlying statutory data has not been 
 * tampered with between deployments or audits.
 */

export function getCorpusHash(): string {
  // Serialize the corpus deterministically.
  // JSON.stringify with a stable replacer/sort is generally fine for read-only `as const` objects,
  // but we string sort keys to ensure absolute determinism regardless of JS engine insertion order.
  const serialized = JSON.stringify(LIMITATION_ACT_1908_CORPUS, (key, value) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((acc, k) => {
        (acc as Record<string, unknown>)[k] = (value as Record<string, unknown>)[k];
        return acc;
      }, {} as Record<string, unknown>);
    }
    return value;
  });

  return createHash("sha256").update(serialized).digest("hex");
}

/**
 * Hard fail-closed guard. Throws an error if the runtime corpus hash 
 * does not match the expected pinned hash.
 */
export function assertCorpusHash(expectedHash: string): void {
  const actualHash = getCorpusHash();
  if (actualHash !== expectedHash) {
    throw new Error(`Corpus Hash Mismatch: Expected ${expectedHash}, but engine calculated ${actualHash}. Legal data may have been tampered with.`);
  }
}
