import { DevelopmentOutputRegistry } from "./DevelopmentOutputRegistry";

const registry = new DevelopmentOutputRegistry();

/**
 * P10-10: Output Corpus Hashing.
 * 
 * Deterministically hashes the output schema registry using SHA-256 
 * via Web Crypto API. Ensures that the memo structure has not been 
 * tampered with between deployments.
 */

export async function getOutputCorpusHash(): Promise<string> {
  const schema = registry.getSchema();
  
  const serialized = JSON.stringify(schema, (key, value) => {
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
 * Hard fail-closed guard. Verifies the runtime output hash matches expected.
 */
export async function assertOutputCorpusHash(expectedHash: string): Promise<void> {
  const actualHash = await getOutputCorpusHash();
  if (actualHash !== expectedHash) {
    throw new Error(`Output Corpus Hash Mismatch: Expected ${expectedHash}, but calculated ${actualHash}. Output schema may have been tampered with.`);
  }
}
