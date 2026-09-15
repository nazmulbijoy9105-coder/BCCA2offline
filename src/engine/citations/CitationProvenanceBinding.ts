import type { AuthoritativePrecedent } from "../CitationValidator";
import type {
  AuthorityProvenance,
  AuthorityValidationStatus,
} from "../authority/AuthorityRegistry";

/**
 * N4-03: Citation Provenance Binding.
 *
 * Binds a deterministically resolved precedent citation to an explicit
 * authority identity and provenance record.
 *
 * IMPORTANT:
 * - This proves identity/provenance binding, not legal correctness.
 * - DEVELOPMENT_FIXTURE must never be treated as production authority.
 * - Runtime timestamps are intentionally excluded.
 */
export type CitationAuthorityBinding = {
  authorityId: string;
  authorityStatus: AuthorityValidationStatus;
  provenance: AuthorityProvenance;
};

function buildAuthorityId(precedent: AuthoritativePrecedent): string {
  return `AUTH-PRECEDENT-${precedent.id}`;
}

export function bindCitationProvenance(
  precedent: AuthoritativePrecedent,
): CitationAuthorityBinding {
  return {
    authorityId: buildAuthorityId(precedent),
    authorityStatus: "DEVELOPMENT_FIXTURE",
    provenance: {
      sourceId: precedent.id,
      citation: precedent.citation,
    },
  };
}
