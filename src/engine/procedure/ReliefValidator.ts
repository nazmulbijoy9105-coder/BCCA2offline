import type { SuitType } from "./ProcedureContracts";

/**
 * P8-07: Relief/Remedy Validator.
 * 
 * Ensures that the relief prayed for in the plaint is legally coherent 
 * with the procedural suit type. Prevents incoherent prayers like 
 * Specific Performance in a Possession suit.
 */

export type ReliefType = 
  | "RECOVERY_OF_POSSESSION" 
  | "DECLARATION" 
  | "SPECIFIC_PERFORMANCE" 
  | "PERPETUAL_INJUNCTION" 
  | "MANDAMUS" 
  | "DAMAGES";

const VALID_RELIEFS: Record<SuitType, ReliefType[]> = {
  "POSSESSION": ["RECOVERY_OF_POSSESSION", "DAMAGES"],
  "DECLARATION": ["DECLARATION", "PERPETUAL_INJUNCTION"],
  "DECLARATION_AND_POSSESSION": ["DECLARATION", "RECOVERY_OF_POSSESSION"],
  "PARTITION": ["DECLARATION", "RECOVERY_OF_POSSESSION"],
  "SPECIFIC_PERFORMANCE": ["SPECIFIC_PERFORMANCE", "DAMAGES"],
  "INJUNCTION": ["PERPETUAL_INJUNCTION"],
  "RECOVERY_OF_MONEY": ["DAMAGES"]
};

export type ReliefVerdict = {
  isValid: boolean;
  invalidReliefs: readonly string[];
};

export function validateReliefForSuitType(
  suitType: SuitType,
  prayedReliefs: readonly string[]
): ReliefVerdict {
  const validReliefs = VALID_RELIEFS[suitType];
  
  if (!validReliefs) {
    return { 
      isValid: false, 
      invalidReliefs: prayedReliefs 
    };
  }

  const invalidReliefs = prayedReliefs.filter(
    r => !validReliefs.includes(r as ReliefType)
  );

  return {
    isValid: invalidReliefs.length === 0,
    invalidReliefs
  };
}
