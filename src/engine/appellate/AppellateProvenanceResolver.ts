import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";
import { DevelopmentAuthorityRegistry } from "../authority/DevelopmentAuthorityRegistry";
import type {
  AuthorityProvenance,
  AuthorityRegistryIdentity,
  AuthorityValidationStatus,
} from "../authority/AuthorityRegistry";

const registry = new DevelopmentAppellateRegistry();
const authorityRegistry = new DevelopmentAuthorityRegistry();

/**
 * P9-11 / N4-04: Appellate Provenance Binding.
 *
 * Binds an existing appellate fixture rule to a deterministic authority
 * identity and explicit provenance record.
 *
 * IMPORTANT:
 * - This establishes identity/provenance binding, not legal correctness.
 * - The development fixture remains DEVELOPMENT_FIXTURE.
 * - No runtime timestamps or random values participate in the binding.
 * - Production authority requires a separately validated production registry.
 */

export type AppellateProvenance = {
  ruleId: string;
  statute: string;
  description: string;
  limitationArticle: string;
  authorityId: string;
  authorityStatus: AuthorityValidationStatus;
  authorityRegistryIdentity: AuthorityRegistryIdentity;
  provenance: AuthorityProvenance;
};

function buildAuthorityId(ruleId: string): string {
  return `AUTH-APPELLATE-${ruleId}`;
}

/**
 * Retrieves deterministic provenance for an appellate rule.
 * Returns null if the rule is not found in the development registry.
 */
export function getAppellateProvenance(
  ruleId: string,
): AppellateProvenance | null {
  const rule = registry.getRules().find((r) => r.ruleId === ruleId);

  if (!rule) {
    return null;
  }

  const authorityId = buildAuthorityId(rule.ruleId);

  return {
    ruleId: rule.ruleId,
    statute: rule.statute,
    description: rule.description,
    limitationArticle: rule.limitation.article,
    authorityId,
    authorityStatus: registry.authorityStatus,
    authorityRegistryIdentity: authorityRegistry.identity,
    provenance: {
      sourceId: rule.statute,
      citation: rule.limitation.article,
    },
  };
}

/**
 * Hard fail-closed guard.
 *
 * Verifies that an applied appellate rule has deterministic provenance
 * and remains explicitly classified as development-only authority.
 */
export function assertAppellateProvenance(ruleId: string): void {
  const provenance = getAppellateProvenance(ruleId);

  if (!provenance) {
    throw new Error(
      `Appellate Provenance Violation: Rule ${ruleId} does not exist in the development fixture registry.`,
    );
  }

  if (provenance.authorityStatus !== "DEVELOPMENT_FIXTURE") {
    throw new Error(
      `Appellate Provenance Violation: Rule ${ruleId} has unexpected authority status ${provenance.authorityStatus}.`,
    );
  }

  if (!provenance.authorityId || !provenance.provenance.sourceId) {
    throw new Error(
      `Appellate Provenance Violation: Rule ${ruleId} has incomplete authority identity.`,
    );
  }
}
