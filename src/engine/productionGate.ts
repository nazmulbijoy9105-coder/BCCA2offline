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
 * Production legal analysis requires BOTH:
 *   - a VALIDATED_PRODUCTION legal corpus, and
 *   - VALIDATED_PRODUCTION legal authority.
 *
 * Development fixtures are allowed outside production.
 *
 * The explicit allowDevelopmentCorpus override exists only for
 * controlled demo/development scenarios and is intentionally explicit.
 */
export function assertLegalEngineProductionReady(
  isProduction: boolean,
  status: LegalEngineRuntimeStatus,
  allowDevelopmentCorpus: boolean = false,
): void {
  if (!isProduction) {
    return;
  }

  if (allowDevelopmentCorpus) {
    return;
  }

  if (
    status.corpusMode === "VALIDATED_PRODUCTION" &&
    status.authorityStatus === "VALIDATED_PRODUCTION"
  ) {
    return;
  }

  throw new Error(
    "production legal analysis requires VALIDATED_PRODUCTION corpus and authority",
  );
}
