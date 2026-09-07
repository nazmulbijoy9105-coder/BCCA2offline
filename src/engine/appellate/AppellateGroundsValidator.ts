import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";
import type { AppellateRemedyType } from "./AppellateContracts";

const registry = new DevelopmentAppellateRegistry();

/**
 * P9-04: Appellate Grounds Validator.
 * 
 * Verifies that the grounds asserted for an appeal or review are legally
 * permissible under the registry rules (e.g., Section 100 CPC limits 
 * second appeals to substantial questions of law only).
 */

export type GroundsVerdict = {
  isValid: boolean;
  invalidGrounds: readonly string[];
};

export function validateAppellateGrounds(
  remedyType: AppellateRemedyType,
  assertedGrounds: readonly string[]
): GroundsVerdict {
  const candidateRules = registry.getCandidateRules(remedyType);

  if (candidateRules.length === 0) {
    return {
      isValid: false,
      invalidGrounds: assertedGrounds,
    };
  }

  const rule = candidateRules[0];
  const allowedGrounds = rule.grounds;

  // Check if asserted grounds match any of the allowed grounds
  const invalidGrounds = assertedGrounds.filter(
    ag => !allowedGrounds.some(og => ag.toLowerCase().includes(og.toLowerCase()) || og.toLowerCase().includes(ag.toLowerCase()))
  );

  return {
    isValid: invalidGrounds.length === 0,
    invalidGrounds,
  };
}
