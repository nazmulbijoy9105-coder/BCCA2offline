import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";

const registry = new DevelopmentAppellateRegistry();

/**
 * P9-11: Appellate Provenance Binding.
 * 
 * Ensures that any appellate rule applied by the engine can be traced 
 * back to its authoritative statutory source.
 */

export type AppellateProvenance = {
  ruleId: string;
  statute: string;
  description: string;
  limitationArticle: string;
};

/**
 * Retrieves the statutory provenance for a given appellate rule ID.
 * Returns null if the rule is not found in the registry.
 */
export function getAppellateProvenance(ruleId: string): AppellateProvenance | null {
  const rule = registry.getRules().find(r => r.ruleId === ruleId);
  
  if (!rule) {
    return null;
  }

  return {
    ruleId: rule.ruleId,
    statute: rule.statute,
    description: rule.description,
    limitationArticle: rule.limitation.article,
  };
}

/**
 * Hard fail-closed guard. Verifies that an applied appellate rule has verifiable provenance.
 */
export function assertAppellateProvenance(ruleId: string): void {
  const provenance = getAppellateProvenance(ruleId);
  if (!provenance) {
    throw new Error(`Appellate Provenance Violation: Rule ${ruleId} does not exist in the authoritative registry.`);
  }
}
