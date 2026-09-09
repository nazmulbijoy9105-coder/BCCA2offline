import type { SuitType } from "./ProcedureContracts";

/**
 * P8-06: Procedural Limitation Interaction.
 *
 * No second hardcoded limitation-article map is maintained here.
 * Limitation law belongs to the limitation subsystem. Cross-domain
 * interaction requires a separately validated production graph.
 */

export type InteractionVerdict = {
  isValid: boolean;
  reason: string;
};

export function verifyProceduralLimitationInteraction(
  suitType: SuitType,
  appliedArticle: string,
): InteractionVerdict {
  void suitType;
  void appliedArticle;

  return {
    isValid: false,
    reason:
      "NOT_DETERMINED — no validated procedural/limitation cross-domain rule graph is available; human legal review required.",
  };
}
