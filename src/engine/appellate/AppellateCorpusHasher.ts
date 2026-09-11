import { canonicalHash } from "../../utils/crypto";
import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";

const registry = new DevelopmentAppellateRegistry();

/**
 * P9-08: Appellate Corpus Hashing.
 * 
 * Deterministically hashes the appellate rules registry using SHA-256 
 * via Web Crypto API. Ensures that appellate rules (forums, limitation, 
 * grounds) have not been tampered with between deployments.
 */

export async function getAppellateCorpusHash(): Promise<string> {
  const rules = registry.getRules();

  // Preserve the existing deterministic rule ordering while using
  // the repository-wide canonical SHA-256 implementation.
  const sortedRules = [...rules].sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId),
  );

  return canonicalHash(sortedRules);
}

/**
 * Hard fail-closed guard. Verifies the runtime appellate hash matches expected.
 */
export async function assertAppellateCorpusHash(expectedHash: string): Promise<void> {
  const actualHash = await getAppellateCorpusHash();
  if (actualHash !== expectedHash) {
    throw new Error(`Appellate Corpus Hash Mismatch: Expected ${expectedHash}, but calculated ${actualHash}. Appellate rules may have been tampered with.`);
  }
}
