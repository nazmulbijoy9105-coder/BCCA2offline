import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";
import { DevelopmentAuthorityRegistry } from "../authority/DevelopmentAuthorityRegistry";
import type {
  AuthorityProvenance,
  AuthorityRegistryIdentity,
  AuthorityValidationStatus,
} from "../authority/AuthorityRegistry";

const registry = new DevelopmentProcedureRegistry();
const authorityRegistry = new DevelopmentAuthorityRegistry();

/**
 * P8-14 / N4-04: Procedural Provenance Binding.
 *
 * Binds an existing procedure fixture rule to a deterministic authority
 * identity and explicit provenance record.
 *
 * IMPORTANT:
 * - This establishes identity/provenance binding, not legal correctness.
 * - The development fixture remains DEVELOPMENT_FIXTURE.
 * - No runtime timestamps or random values participate in the binding.
 * - Production authority requires a separately validated production registry.
 */

export type ProceduralProvenance = {
  ruleId: string;
  statute: string;
  actRef: string;
  description: string;
  authorityId: string;
  authorityStatus: AuthorityValidationStatus;
  authorityRegistryIdentity: AuthorityRegistryIdentity;
  provenance: AuthorityProvenance;
};

function buildAuthorityId(ruleId: string): string {
  return `AUTH-PROCEDURE-${ruleId}`;
}

/**
 * Retrieves deterministic provenance for a procedure rule.
 * Returns null if the rule is not found in the development registry.
 */
export function getProceduralProvenance(
  ruleId: string,
): ProceduralProvenance | null {
  const rule = registry.getRules().find((r) => r.ruleId === ruleId);

  if (!rule) {
    return null;
  }

  const authorityId = buildAuthorityId(rule.ruleId);

  return {
    ruleId: rule.ruleId,
    statute: rule.statute,
    actRef: rule.courtFee.actRef,
    description: rule.description,
    authorityId,
    authorityStatus: registry.authorityStatus,
    authorityRegistryIdentity: authorityRegistry.identity,
    provenance: {
      sourceId: rule.statute,
      citation: rule.courtFee.actRef,
    },
  };
}

/**
 * Hard fail-closed guard.
 *
 * Verifies that an applied procedure rule has deterministic provenance
 * and remains explicitly classified as development-only authority.
 */
export function assertProceduralProvenance(ruleId: string): void {
  const provenance = getProceduralProvenance(ruleId);

  if (!provenance) {
    throw new Error(
      `Procedural Provenance Violation: Rule ${ruleId} does not exist in the development procedure fixture.`,
    );
  }

  if (provenance.authorityStatus !== "DEVELOPMENT_FIXTURE") {
    throw new Error(
      `Procedural Provenance Violation: Rule ${ruleId} has unexpected authority status ${provenance.authorityStatus}.`,
    );
  }

  if (!provenance.authorityId || !provenance.provenance.sourceId) {
    throw new Error(
      `Procedural Provenance Violation: Rule ${ruleId} has incomplete authority identity.`,
    );
  }
}
