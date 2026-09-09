import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";

/**
 * P9-09: Appellate Integrity Verifier.
 * 
 * Verifies the structural integrity of the development appellate fixture.
 * Ensures arrays are populated, required fields exist, and the schema is sound.
 * Fails closed if the registry is corrupted or malformed.
 */

export function verifyAppellateIntegrity(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const registry = new DevelopmentAppellateRegistry();
  const rules = registry.getRules();

  if (!Array.isArray(rules) || rules.length === 0) {
    errors.push("Appellate rules array is missing or empty.");
    return { isValid: false, errors };
  }

  for (const rule of rules) {
    if (!rule.ruleId) errors.push("Missing ruleId in appellate rule.");
    if (!rule.remedyType) errors.push(`Missing remedyType in rule ${rule.ruleId}.`);
    if (!rule.statute) errors.push(`Missing statute in rule ${rule.ruleId}.`);
    if (!rule.forum || !rule.forum.primaryForum) {
      errors.push(`Missing forum.primaryForum in rule ${rule.ruleId}.`);
    }
    if (!rule.limitation || !rule.limitation.article || typeof rule.limitation.periodDays !== 'number') {
      errors.push(`Missing/invalid limitation metadata in rule ${rule.ruleId}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hard fail-closed guard. Throws if the development fixture is structurally invalid.
 */
export function assertAppellateIntegrity(): void {
  const { isValid, errors } = verifyAppellateIntegrity();
  if (!isValid) {
    throw new Error(`Appellate Integrity Check Failed: ${errors.join(", ")}`);
  }
}
