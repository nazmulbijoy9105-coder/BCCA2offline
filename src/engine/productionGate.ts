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
 *
 * Development/test execution may use the deterministic development fixture.
 * Production execution must have an explicitly validated legal corpus and
 * validated authority registry, unless explicitly bypassed for a hosted demo.
 */
export function assertLegalEngineProductionReady(
  isProduction: boolean,
  status: LegalEngineRuntimeStatus,
  allowDevelopmentCorpus: boolean = false,
): void {
  if (!isProduction) return;
  
  // Allow hosted demos (e.g., Vercel) to run the development fixture
  if (allowDevelopmentCorpus) return;

  if (
    status.corpusMode !== "VALIDATED_PRODUCTION" ||
    status.authorityStatus !== "VALIDATED_PRODUCTION"
  ) {
    throw new Error(
      "FATAL LEGAL ENGINE CONFIGURATION: production legal analysis requires " +
      "VALIDATED_PRODUCTION corpus and authority registry.",
    );
  }
}
