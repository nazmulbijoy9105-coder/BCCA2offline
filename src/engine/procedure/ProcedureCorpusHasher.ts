import { canonicalHash } from "../../utils/crypto";
import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";

const registry = new DevelopmentProcedureRegistry();

/**
 * P8-11: Procedure Corpus Hashing.
 * 
 * Deterministically hashes the procedural rules registry using SHA-256.
 * Ensures that procedural rules (jurisdiction, fees, prerequisites) 
 * have not been tampered with between deployments.
 */



export function getProcedureCorpusHash(): string {
  const rules = registry.getRules();
  const sortedRules = [...rules].sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId),
  );

  return canonicalHash(sortedRules);
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
