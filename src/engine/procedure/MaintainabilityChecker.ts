import type { SuitType } from "./ProcedureContracts";

/**
 * P8-04: Maintainability Checks.
 * 
 * Verifies whether a suit is maintainable based on the extracted facts.
 * E.g., Flags a Section 42 Declaration suit as defective if the plaintiff 
 * is out of possession but fails to pray for consequential possession.
 */

export type MaintainabilityFact = {
  predicate: string;
  object?: string | null;
};

export type MaintainabilityVerdict = {
  isMaintainable: boolean;
  defects: string[];
};

export function checkMaintainability(
  suitType: SuitType,
  facts: readonly MaintainabilityFact[]
): MaintainabilityVerdict {
  const defects: string[] = [];

  // Section 42 SRA Proviso Check
  if (suitType === "DECLARATION") {
    const isOutOfPossession = facts.some(
      f => f.predicate === "Possession Status" && f.object === "DISPOSSESSED"
    );
    
    const praysForConsequentialRelief = facts.some(
      f => f.predicate === "Relief" && (f.object === "RECOVERY_OF_POSSESSION" || f.object === "POSSESSION")
    );

    if (isOutOfPossession && !praysForConsequentialRelief) {
      defects.push("Section 42 Proviso Violation: Plaintiff is out of possession but did not pray for consequential relief of possession.");
    }
  }

  // Section 8 SRA Check (Possession suit)
  if (suitType === "POSSESSION") {
    const hasPriorPossession = facts.some(
      f => f.predicate === "Possession Status" && (f.object === "IN_POSSESSION" || f.object === "PRIOR_POSSESSION")
    );
    
    if (!hasPriorPossession) {
      defects.push("Section 8 SRA Defect: Plaintiff must prove prior possession to maintain a suit for recovery of possession.");
    }
  }

  return {
    isMaintainable: defects.length === 0,
    defects,
  };
}
