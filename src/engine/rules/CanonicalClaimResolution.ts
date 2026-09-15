import {
  getClaimDefinition,
} from "./EnterpriseClaimMatrix";

export type CanonicalClaimId =
  | "SPECIFIC_PERFORMANCE"
  | "POSSESSION_RECOVERY_SEC8"
  | "PARTITION"
  | "DECLARATION_SEC42"
  | "INHERITANCE_CONSULTATION";

export type CanonicalClaimResolutionStatus =
  | "RESOLVED"
  | "UNRESOLVED"
  | "AMBIGUOUS";

export interface CanonicalClaimResolution {
  readonly status: CanonicalClaimResolutionStatus;
  readonly claimId: CanonicalClaimId | null;
  readonly matchedSignals: readonly string[];
  readonly reason: string;
}

const CANONICAL_CLAIM_IDS: readonly CanonicalClaimId[] = [
  "SPECIFIC_PERFORMANCE",
  "POSSESSION_RECOVERY_SEC8",
  "PARTITION",
  "DECLARATION_SEC42",
  "INHERITANCE_CONSULTATION",
];

function assertCanonicalRegistryIntegrity(): void {
  for (const claimId of CANONICAL_CLAIM_IDS) {
    const definition = getClaimDefinition(claimId);

    if (!definition) {
      throw new Error(
        `CANONICAL_CLAIM_REGISTRY_INTEGRITY_ERROR: missing ${claimId}.`,
      );
    }
  }
}

assertCanonicalRegistryIntegrity();

function resolved(
  claimId: CanonicalClaimId,
  matchedSignals: readonly string[],
  reason: string,
): CanonicalClaimResolution {
  return Object.freeze({
    status: "RESOLVED" as const,
    claimId,
    matchedSignals: Object.freeze([...matchedSignals]),
    reason,
  });
}

function unresolved(
  reason: string,
  matchedSignals: readonly string[] = [],
): CanonicalClaimResolution {
  return Object.freeze({
    status: "UNRESOLVED" as const,
    claimId: null,
    matchedSignals: Object.freeze([...matchedSignals]),
    reason,
  });
}

function ambiguous(
  reason: string,
  matchedSignals: readonly string[],
): CanonicalClaimResolution {
  return Object.freeze({
    status: "AMBIGUOUS" as const,
    claimId: null,
    matchedSignals: Object.freeze([...matchedSignals]),
    reason,
  });
}

/**
 * P2-09B canonical legal-claim resolver.
 *
 * CanonicalClaimId is the authoritative enterprise taxonomy.
 * This function deliberately does not attempt to force every canonical
 * claim into the legacy ClaimType union.
 *
 * Resolution is deterministic and fail-closed.
 */
export function resolveCanonicalClaim(
  factPattern: string,
  focusDomain = "",
): CanonicalClaimResolution {
  const text = `${focusDomain} ${factPattern}`.toLowerCase();

  const signals: string[] = [];

  const hasSpecificPerformance =
    /\b(?:specific\s+performance|bainapatra|agreement\s+to\s+sell|earnest\s+money)\b/.test(
      text,
    );

  const hasPossessionRecovery =
    /\b(?:recovery\s+of\s+possession|recover\s+possession|recovery\s+of\s+immovable\s+property|possession\s+recovery)\b/.test(
      text,
    ) ||
    /\bsection\s*8\b.*\b(?:specific\s+relief|possession)\b/.test(text) ||
    /\b(?:specific\s+relief\s+act|sra)\b.*\bsection\s*8\b/.test(text);

  const hasPartition =
    /\bpartition\b/.test(text) ||
    /\bpartition\s+suit\b/.test(text) ||
    /\b(?:co-?sharer|co-?owner)s?\b.*\bpartition\b/.test(text) ||
    /\bpartition\b.*\b(?:co-?sharer|co-?owner)s?\b/.test(text);

  const hasDeclarationSec42 =
    /\bdeclaration\b/.test(text) &&
    (
      /\bsection\s*42\b/.test(text) ||
      /\bspecific\s+relief\s+act\b/.test(text) ||
      /\bsra\b/.test(text)
    );

  const hasInheritance =
    /\b(?:inheritance|succession|heir|heirs|warisan|intestate|ancestor|predeceased)\b/.test(
      text,
    );

  if (hasSpecificPerformance) {
    signals.push("SPECIFIC_PERFORMANCE");
  }

  if (hasPossessionRecovery) {
    signals.push("POSSESSION_RECOVERY_SEC8");
  }

  if (hasPartition) {
    signals.push("PARTITION");
  }

  if (hasDeclarationSec42) {
    signals.push("DECLARATION_SEC42");
  }

  if (hasInheritance) {
    signals.push("INHERITANCE_CONSULTATION");
  }

  /*
   * Explicit priority is only allowed where the signal itself is
   * sufficiently specific. We never use a broad "possession" or
   * "declaration" keyword as a substitute for a canonical claim.
   */
  if (signals.length === 0) {
    return unresolved(
      "No canonical enterprise claim was deterministically identified.",
    );
  }

  if (signals.length > 1) {
    return ambiguous(
      `Multiple canonical claim signals were detected: ${signals.join(", ")}.`,
      signals,
    );
  }

  const claimId = signals[0] as CanonicalClaimId;

  switch (claimId) {
    case "SPECIFIC_PERFORMANCE":
      return resolved(
        claimId,
        signals,
        "Specific-performance indicators deterministically matched the canonical claim.",
      );

    case "POSSESSION_RECOVERY_SEC8":
      return resolved(
        claimId,
        signals,
        "Possession-recovery indicators deterministically matched the SRA Section 8 canonical claim.",
      );

    case "PARTITION":
      return resolved(
        claimId,
        signals,
        "Partition/co-sharer indicators deterministically matched the canonical partition claim.",
      );

    case "DECLARATION_SEC42":
      return resolved(
        claimId,
        signals,
        "Declaration/Section 42 indicators deterministically matched the canonical declaration claim.",
      );

    case "INHERITANCE_CONSULTATION":
      return resolved(
        claimId,
        signals,
        "Inheritance/succession indicators deterministically matched the canonical inheritance claim.",
      );

    default:
      return unresolved(
        "Canonical claim signal did not resolve to a registered enterprise claim.",
        signals,
      );
  }
}
