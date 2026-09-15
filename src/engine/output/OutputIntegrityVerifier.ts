import type { CaseAnalysisResponse } from "../../types/types";
import { DevelopmentOutputRegistry } from "./DevelopmentOutputRegistry";

/**
 * P10-11: Output Integrity Verifier.
 *
 * Verifies:
 * 1. The deterministic output schema registry is structurally valid.
 * 2. The authority registry identity propagated into outputIntegrity is
 *    present, structurally valid, and exactly matches the authority
 *    identity carried by RuleGraphIdentity.
 *
 * This verifier does NOT independently source or recompute authority
 * registry identity. Authoritative registry identity verification remains
 * the responsibility of the engine / AuthorityRegistry production gate.
 */

function verifyAuthorityRegistryIdentityConsistency(
  response: CaseAnalysisResponse,
  errors: string[],
): void {
  const ruleGraphIdentity = response.ruleGraphIdentity;
  const outputIntegrity = response.outputIntegrity;
  const outputAuthorityIdentity =
    outputIntegrity?.authorityRegistryIdentity;

  if (!ruleGraphIdentity) {
    errors.push("Missing RuleGraphIdentity.");
    return;
  }

  if (
    typeof ruleGraphIdentity.authorityRegistryVersion !== "string" ||
    ruleGraphIdentity.authorityRegistryVersion.length === 0
  ) {
    errors.push(
      "Missing or invalid RuleGraphIdentity authorityRegistryVersion.",
    );
  }

  if (
    typeof ruleGraphIdentity.authorityRegistryDigest !== "string" ||
    ruleGraphIdentity.authorityRegistryDigest.length === 0
  ) {
    errors.push(
      "Missing or invalid RuleGraphIdentity authorityRegistryDigest.",
    );
  }

  if (!outputIntegrity) {
    errors.push("Missing outputIntegrity metadata.");
    return;
  }

  if (!outputAuthorityIdentity) {
    errors.push("Missing output authority registry identity.");
    return;
  }

  if (
    typeof outputAuthorityIdentity.authorityRegistryVersion !== "string" ||
    outputAuthorityIdentity.authorityRegistryVersion.length === 0
  ) {
    errors.push(
      "Missing or invalid output authorityRegistryVersion.",
    );
  }

  if (
    typeof outputAuthorityIdentity.authorityRegistryDigest !== "string" ||
    outputAuthorityIdentity.authorityRegistryDigest.length === 0
  ) {
    errors.push(
      "Missing or invalid output authorityRegistryDigest.",
    );
  }

  if (
    typeof ruleGraphIdentity.authorityRegistryVersion === "string" &&
    typeof outputAuthorityIdentity.authorityRegistryVersion === "string" &&
    ruleGraphIdentity.authorityRegistryVersion !==
      outputAuthorityIdentity.authorityRegistryVersion
  ) {
    errors.push(
      "Output authorityRegistryVersion does not match RuleGraphIdentity.",
    );
  }

  if (
    typeof ruleGraphIdentity.authorityRegistryDigest === "string" &&
    typeof outputAuthorityIdentity.authorityRegistryDigest === "string" &&
    ruleGraphIdentity.authorityRegistryDigest !==
      outputAuthorityIdentity.authorityRegistryDigest
  ) {
    errors.push(
      "Output authorityRegistryDigest does not match RuleGraphIdentity.",
    );
  }
}

/**
 * Verifies output schema integrity and, when a response is supplied,
 * verifies authority registry identity consistency across the final output.
 *
 * Without a response, this preserves the original schema-only P10 contract.
 */
export function verifyOutputIntegrity(
  response?: CaseAnalysisResponse,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const registry = new DevelopmentOutputRegistry();
  const schema = registry.getSchema();

  if (!schema) {
    errors.push("Output schema is missing.");
    return { isValid: false, errors };
  }

  if (!schema.schemaId) errors.push("Missing schemaId in output schema.");
  if (!schema.version) errors.push("Missing version in output schema.");

  if (!Array.isArray(schema.sections) || schema.sections.length === 0) {
    errors.push("Output schema sections array is missing or empty.");
    return { isValid: false, errors };
  }

  for (const section of schema.sections) {
    if (!section.sectionType) {
      errors.push("Missing sectionType in memo section.");
    }

    if (typeof section.required !== "boolean") {
      errors.push(
        `Missing or invalid 'required' boolean in section ${section.sectionType}.`,
      );
    }

    if (!section.description) {
      errors.push(
        `Missing description in section ${section.sectionType}.`,
      );
    }
  }

  if (response) {
    verifyAuthorityRegistryIdentityConsistency(response, errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hard fail-closed guard. Throws an error if output integrity is invalid.
 */
export function assertOutputIntegrity(
  response?: CaseAnalysisResponse,
): void {
  const { isValid, errors } = verifyOutputIntegrity(response);

  if (!isValid) {
    throw new Error(
      `Output Integrity Check Failed: ${errors.join(", ")}`,
    );
  }
}
