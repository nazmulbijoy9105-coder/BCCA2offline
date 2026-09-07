import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";
import type { CourtTier, SuitType, ProcedureRule } from "./ProcedureContracts";

const registry = new DevelopmentProcedureRegistry();

/**
 * P8-02: Jurisdiction & Pecuniary Limits Evaluator.
 * 
 * Deterministically evaluates whether a proposed court tier has the 
 * jurisdiction to hear a suit based on its type and pecuniary value.
 */

export type JurisdictionVerdict = {
  isValid: boolean;
  reason: string;
  matchedRule?: ProcedureRule;
};

export function evaluateJurisdiction(
  suitType: SuitType,
  proposedCourtTier: CourtTier,
  suitValue?: number
): JurisdictionVerdict {
  const candidateRules = registry.getCandidateRules(suitType);

  if (candidateRules.length === 0) {
    return {
      isValid: false,
      reason: `No procedure rules found for suit type: ${suitType}`,
    };
  }

  // Find the rule that matches the proposed court tier
  const matchedRule = candidateRules.find(
    (rule) => rule.jurisdiction.primaryCourtTier === proposedCourtTier
  );

  if (!matchedRule) {
    return {
      isValid: false,
      reason: `Court tier ${proposedCourtTier} is not authorized for suit type ${suitType}.`,
    };
  }

  // Check pecuniary limits if they exist for the rule
  if (matchedRule.jurisdiction.pecuniaryLimit) {
    const { min, max } = matchedRule.jurisdiction.pecuniaryLimit;
    
    if (suitValue === undefined) {
      return {
        isValid: false,
        reason: `Suit value is required for pecuniary jurisdiction check (Limit: ${min} - ${max}).`,
        matchedRule,
      };
    }

    if (suitValue < min || suitValue > max) {
      return {
        isValid: false,
        reason: `Suit value ${suitValue} falls outside the pecuniary limit (${min} - ${max}) for ${proposedCourtTier}.`,
        matchedRule,
      };
    }
  }

  return {
    isValid: true,
    reason: "Jurisdiction and pecuniary limits verified.",
    matchedRule,
  };
}
