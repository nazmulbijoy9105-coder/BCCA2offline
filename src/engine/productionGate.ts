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
 * There is intentionally NO production override for development
 * corpus or development authority.
 */
export function assertLegalEngineProductionReady(
  isProduction: boolean,
  status: LegalEngineRuntimeStatus,
): void {
  if (!isProduction) {
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
