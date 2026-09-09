import { canonicalHash } from "../../utils/crypto";
import { DevelopmentOutputRegistry } from "./DevelopmentOutputRegistry";

const registry = new DevelopmentOutputRegistry();

/**
 * P10-10: Deterministic output schema hashing.
 *
 * canonicalHash provides the repository's canonical deterministic SHA-256
 * representation. The schema is hashed as data, never using runtime time,
 * randomness, or object insertion order.
 */

export function getOutputCorpusHash(): string {
  return canonicalHash(registry.getSchema());
}

export function assertOutputCorpusHash(expectedHash: string): void {
  const actualHash = getOutputCorpusHash();
  if (actualHash !== expectedHash) {
    throw new Error(
      `Output Corpus Hash Mismatch: Expected ${expectedHash}, but calculated ${actualHash}. Output schema may have been tampered with.`,
    );
  }
}
