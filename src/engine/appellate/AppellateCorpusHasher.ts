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
  // Sort by ruleId to ensure deterministic order
  const sortedRules = [...rules].sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  
  const serialized = JSON.stringify(sortedRules, (key, value) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((acc, k) => {
        (acc as Record<string, unknown>)[k] = (value as Record<string, unknown>)[k];
        return acc;
      }, {} as Record<string, unknown>);
    }
    return value;
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
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
