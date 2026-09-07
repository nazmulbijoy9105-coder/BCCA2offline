import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";

/**
 * P8-12: Procedure Integrity Verifier.
 * 
 * Verifies the structural integrity of the procedural rules registry.
 * Ensures arrays are populated, required fields exist, and the schema is sound.
 * Fails closed if the registry is corrupted or malformed.
 */

export function verifyProcedureIntegrity(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const registry = new DevelopmentProcedureRegistry();
  const rules = registry.getRules();

  if (!Array.isArray(rules) || rules.length === 0) {
    errors.push("Procedure rules array is missing or empty.");
    return { isValid: false, errors };
  }

  for (const rule of rules) {
    if (!rule.ruleId) errors.push("Missing ruleId in procedure rule.");
    if (!rule.suitType) errors.push(`Missing suitType in rule ${rule.ruleId}.`);
    if (!rule.statute) errors.push(`Missing statute in rule ${rule.ruleId}.`);
    if (!rule.jurisdiction || !rule.jurisdiction.primaryCourtTier) {
      errors.push(`Missing jurisdiction.primaryCourtTier in rule ${rule.ruleId}.`);
    }
    if (!rule.courtFee || !rule.courtFee.type || !rule.courtFee.actRef) {
      errors.push(`Missing courtFee metadata in rule ${rule.ruleId}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hard fail-closed guard. Throws an error if the procedure registry is structurally invalid.
 */
export function assertProcedureIntegrity(): void {
  const { isValid, errors } = verifyProcedureIntegrity();
  if (!isValid) {
    throw new Error(`Procedure Integrity Check Failed: ${errors.join(", ")}`);
  }
}
