/**
 * N4-01: Canonical Authority Registry Contract.
 *
 * Establishes one dependency-neutral authority identity/provenance contract
 * consumed by citation, statute, procedure, appellate and precedent layers.
 *
 * IMPORTANT:
 * - This contract establishes identity and provenance.
 * - A deterministic digest proves identity/integrity, not legal correctness.
 * - DEVELOPMENT_FIXTURE must never be treated as production authority.
 * - Production authority requires VALIDATED_PRODUCTION.
 * - Runtime audit timestamps are metadata only and must never participate
 *   in deterministic authority identity or registry digests.
 */

export type AuthorityValidationStatus =
  | "DEVELOPMENT_FIXTURE"
  | "SOURCE_VERIFIED"
  | "LEGALLY_VALIDATED"
  | "INDEPENDENTLY_VALIDATED"
  | "VALIDATED_PRODUCTION";

export type AuthorityKind =
  | "STATUTE"
  | "PROCEDURE"
  | "APPELLATE"
  | "PRECEDENT"
  | "REGULATION"
  | "RULE"
  | "OTHER";

export type AuthorityProvenance = {
  /**
   * Stable identifier of the underlying authoritative source.
   */
  sourceId: string;

  /**
   * Human-readable citation to the source.
   */
  citation: string;

  /**
   * Optional official source location.
   */
  provenanceUrl?: string;

  /**
   * Optional gazette/publication reference.
   */
  officialGazetteRef?: string;
};

export type AuthorityRecord = {
  /**
   * Stable identifier for this authority record.
   */
  authorityId: string;

  /**
   * Authority classification.
   */
  kind: AuthorityKind;

  /**
   * Act/statute/rule title where applicable.
   */
  actOrStatute?: string;

  /**
   * Section, article, rule, order, or other provision identifier.
   */
  sectionOrRule?: string;

  /**
   * Canonical source identifier.
   */
  sourceId: string;

  /**
   * Formal legal citation.
   */
  citation: string;

  /**
   * Source provenance and origin information.
   */
  provenance: AuthorityProvenance;

  /**
   * Explicit authority-validation state.
   */
  validationStatus: AuthorityValidationStatus;
};

export type AuthorityRegistryIdentity = {
  /**
   * Registry version identifies the exact registry definition.
   */
  authorityRegistryVersion: string;

  /**
   * Deterministic digest of canonical authority-registry contents.
   *
   * Must not contain runtime timestamps, random values, or other
   * non-deterministic inputs.
   */
  authorityRegistryDigest: string;
};

export type AuthorityRegistry = {
  /**
   * Exact registry identity consumed by RuleGraphIdentity.
   */
  readonly identity: AuthorityRegistryIdentity;

  /**
   * Explicit registry authority classification.
   */
  readonly authorityStatus: AuthorityValidationStatus;

  /**
   * Return all canonical authority records.
   */
  getAuthorities(): readonly AuthorityRecord[];

  /**
   * Resolve one authority by stable identifier.
   */
  getAuthorityById(authorityId: string): AuthorityRecord | null;

  /**
   * Resolve an authority by its canonical source identifier.
   */
  getAuthorityBySourceId(sourceId: string): AuthorityRecord | null;
};

/**
 * Production authority is deliberately fail-closed.
 *
 * A development or merely source-verified registry cannot satisfy
 * production authority requirements.
 */
export function isProductionAuthority(
  status: AuthorityValidationStatus,
): boolean {
  return status === "VALIDATED_PRODUCTION";
}
