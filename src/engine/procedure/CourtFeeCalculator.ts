import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";
import type { SuitType } from "./ProcedureContracts";

const registry = new DevelopmentProcedureRegistry();

/**
 * P8-03: Court Fee Calculator.
 * 
 * Deterministically calculates court fees based on suit type and value.
 * Uses the Court Fees Act 1870 rules defined in the procedure registry.
 */

export type CourtFeeVerdict = {
  feeAmount: number;
  feeType: "AD_VALOREM" | "FIXED" | "MULTIPLE";
  actRef: string;
  reason: string;
};

export function calculateCourtFee(
  suitType: SuitType,
  suitValue?: number
): CourtFeeVerdict | null {
  const candidateRules = registry.getCandidateRules(suitType);

  if (candidateRules.length === 0) {
    return null;
  }

  // Use the first matched rule for the suit type
  const rule = candidateRules[0];
  const { type, actRef } = rule.courtFee;

  if (type === "FIXED") {
    return {
      feeAmount: 1000, // Deterministic fixed fee (e.g., 1000 BDT for declaration)
      feeType: "FIXED",
      actRef,
      reason: "Fixed court fee applied under Court Fees Act 1870.",
    };
  }

  if (type === "AD_VALOREM") {
    if (suitValue === undefined || suitValue <= 0) {
      return {
        feeAmount: 0,
        feeType: "AD_VALOREM",
        actRef,
        reason: "Suit value is required for ad-valorem fee calculation.",
      };
    }

    // Simplified deterministic ad-valorem: 1% of suit value, capped at 50,000 BDT
    const calculatedFee = Math.min(suitValue * 0.01, 50000);
    
    return {
      feeAmount: calculatedFee,
      feeType: "AD_VALOREM",
      actRef,
      reason: `Ad-valorem fee (1% of ${suitValue}, capped at 50,000) applied.`,
    };
  }

  return null;
}
