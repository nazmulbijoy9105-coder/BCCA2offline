import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";


const registry = new DevelopmentProcedureRegistry();

/**
 * P8-14: Procedural Provenance Binding.
 * 
 * Ensures that any procedural rule applied by the engine can be traced 
 * back to its authoritative statutory source.
 */

export type ProceduralProvenance = {
  ruleId: string;
  statute: string;
  actRef: string;
  description: string;
};

/**
 * Retrieves the statutory provenance for a given procedure rule ID.
 * Returns null if the rule is not found in the registry.
 */
export function getProceduralProvenance(ruleId: string): ProceduralProvenance | null {
  const rule = registry.getRules().find(r => r.ruleId === ruleId);
  
  if (!rule) {
    return null;
  }

  return {
    ruleId: rule.ruleId,
    statute: rule.statute,
    actRef: rule.courtFee.actRef, // E.g., "Court Fees Act 1870, Schedule II, Article 1(iii)"
    description: rule.description,
  };
}

/**
 * Hard fail-closed guard. Verifies that a applied procedure rule has verifiable provenance.
 */
export function assertProceduralProvenance(ruleId: string): void {
  const provenance = getProceduralProvenance(ruleId);
  if (!provenance) {
    throw new Error(`Procedural Provenance Violation: Rule ${ruleId} does not exist in the development procedure fixture.`);
  }
}
