import type { CourtTier, SuitType } from "./ProcedureContracts";

/**
 * P8-02: Jurisdiction Evaluator.
 *
 * The available procedural registry is a development fixture and is not
 * sufficient to establish production jurisdiction. This utility therefore
 * fails closed rather than converting fixture data into a legal conclusion.
 */

export type JurisdictionVerdict = {
  isValid: boolean;
  reason: string;
};

export function evaluateJurisdiction(
  suitType: SuitType,
  proposedCourtTier: CourtTier,
  suitValue?: number,
): JurisdictionVerdict {
  void suitType;
  void proposedCourtTier;
  void suitValue;

  return {
    isValid: false,
    reason:
      "NOT_DETERMINED — no validated production jurisdiction rule graph is available; human legal review required.",
  };
}
