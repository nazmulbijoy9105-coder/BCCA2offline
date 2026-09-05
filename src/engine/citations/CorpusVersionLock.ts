import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";

/**
 * P6-09: Corpus Version Locking.
 * 
 * Provides deterministic access to the exact version of the legal corpus 
 * the engine is operating on. Prevents silent drift during audits.
 */

export function getCorpusVersion(): string {
  return LIMITATION_ACT_1908_CORPUS.version;
}

export function getCorpusName(): string {
  return LIMITATION_ACT_1908_CORPUS.kb_name;
}

export function getCorpusSource(): string {
  return LIMITATION_ACT_1908_CORPUS.source;
}

/**
 * Validates that the engine is running against an expected corpus version.
 * Fails closed if there is a version mismatch.
 */
export function assertCorpusVersion(expectedVersion: string): void {
  const actualVersion = getCorpusVersion();
  if (actualVersion !== expectedVersion) {
    throw new Error(`Corpus Version Mismatch: Expected ${expectedVersion}, but engine is using ${actualVersion}`);
  }
}
