import { canonicalHash } from "../../utils/crypto";
import type { EnterpriseClaimDefinition } from "./EnterpriseClaimMatrix";

export type ClaimAuthorityValidationStatus =
  | "UNRESOLVED"
  | "SOURCE_VERIFIED"
  | "LEGALLY_VALIDATED"
  | "INDEPENDENTLY_VALIDATED"
  | "PRODUCTION_APPROVED";

export interface ClaimAuthorityProvenance {
  authorityId: string;
  act: string;
  section: string;
  sourceId: string;
  validationStatus: ClaimAuthorityValidationStatus;
}

export interface ClaimDefinitionValidation {
  scoped: boolean;
  authoritative: boolean;
  legallyValidated: boolean;
  independentlyValidated: boolean;
  productionApproved: boolean;
}

export interface ClaimDefinitionProvenance {
  authorities: readonly ClaimAuthorityProvenance[];
  validation: ClaimDefinitionValidation;
}

export interface ProvenancedEnterpriseClaimDefinition
  extends EnterpriseClaimDefinition {
  provenance: ClaimDefinitionProvenance;
  definitionHash: string;
}

export function canonicalClaimDefinitionPayload(
  definition: Omit<ProvenancedEnterpriseClaimDefinition, "definitionHash">,
): unknown {
  return {
    claimId: definition.claimId,
    claimName: definition.claimName,
    category: definition.category,
    statutoryBasis: definition.statutoryBasis,
    limitation: definition.limitation,
    maintainabilityRules: definition.maintainabilityRules,
    elements: definition.elements,
    courtFeeType: definition.courtFeeType,
    forum: definition.forum,
    provenance: definition.provenance,
  };
}

export function calculateClaimDefinitionHash(
  definition: Omit<ProvenancedEnterpriseClaimDefinition, "definitionHash">,
): string {
  return canonicalHash(canonicalClaimDefinitionPayload(definition));
}

export function calculateClaimRegistryHash(
  definitions: readonly ProvenancedEnterpriseClaimDefinition[],
): string {
  return canonicalHash(
    definitions.map(definition => ({
      claimId: definition.claimId,
      definitionHash: definition.definitionHash,
    })),
  );
}

export function assertClaimDefinitionProvenance(
  definition: ProvenancedEnterpriseClaimDefinition,
): void {
  if (definition.provenance.authorities.length === 0) {
    throw new Error(
      `Claim Matrix Provenance Violation: ${definition.claimId} has no authority provenance.`,
    );
  }

  for (const authority of definition.provenance.authorities) {
    if (
      !authority.authorityId ||
      !authority.act ||
      !authority.section ||
      !authority.sourceId
    ) {
      throw new Error(
        `Claim Matrix Provenance Violation: ${definition.claimId} contains incomplete authority provenance.`,
      );
    }
  }

  const validation = definition.provenance.validation;

  if (
    validation.productionApproved &&
    (!validation.scoped ||
      !validation.authoritative ||
      !validation.legallyValidated ||
      !validation.independentlyValidated)
  ) {
    throw new Error(
      `Claim Matrix Validation Violation: ${definition.claimId} cannot be production approved without all prerequisite validation states.`,
    );
  }
}

export function assertClaimDefinitionHash(
  definition: ProvenancedEnterpriseClaimDefinition,
): void {
  const actualHash = calculateClaimDefinitionHash(definition);

  if (actualHash !== definition.definitionHash) {
    throw new Error(
      `Claim Matrix Definition Hash Mismatch: ${definition.claimId}.`,
    );
  }
}
