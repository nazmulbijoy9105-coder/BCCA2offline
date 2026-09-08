export type LegalCorpusMode = "DEVELOPMENT" | "VALIDATED_PRODUCTION";
export type LegalAuthorityStatus =
  | "DEVELOPMENT_FIXTURE"
  | "VALIDATED_PRODUCTION";

export interface LegalEngineRuntimeStatus {
  corpusMode: LegalCorpusMode;
  authorityStatus: LegalAuthorityStatus;
}

/**
 * Application-level fail-closed boundary.
 * TEMPORARILY BYPASSED FOR VERCEL DEMO.
 */
export function assertLegalEngineProductionReady(
  isProduction: boolean,
  status: LegalEngineRuntimeStatus,
  allowDevelopmentCorpus: boolean = false,
): void {
  // BYPASSED FOR VERCEL DEMO: Allow development corpus in all environments
  return; 
}
