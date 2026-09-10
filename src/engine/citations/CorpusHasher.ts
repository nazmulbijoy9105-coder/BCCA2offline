import { canonicalHash } from "../../utils/crypto";
import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";

/**
 * P6-12: Legal Corpus Hashing.
 *
 * Deterministically hashes the legal corpus using SHA-256.
 * Allows mathematical proof that the underlying statutory data has not been
 * tampered with between deployments or audits.
 *
 * Uses the repository-wide canonical hashing path so corpus integrity
 * uses the same deterministic SHA-256 implementation as the rest of
 * the legal engine.
 */

export function getCorpusHash(): string {
  return canonicalHash(LIMITATION_ACT_1908_CORPUS);
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
