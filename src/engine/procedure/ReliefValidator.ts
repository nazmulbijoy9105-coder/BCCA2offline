import type { SuitType } from "./ProcedureContracts";

/**
 * P8-07: Relief/Remedy Validator.
 *
 * Relief mappings are legal rules. No affirmative mapping is generated from
 * an unvalidated development fixture.
 */

export type ReliefType =
  | "RECOVERY_OF_POSSESSION"
  | "DECLARATION"
  | "SPECIFIC_PERFORMANCE"
  | "PERPETUAL_INJUNCTION"
  | "MANDAMUS"
  | "DAMAGES";

export type ReliefVerdict = {
  isValid: boolean;
  invalidReliefs: readonly string[];
};

export function validateReliefForSuitType(
  suitType: SuitType,
  prayedReliefs: readonly string[],
): ReliefVerdict {
  void suitType;

  return {
    isValid: false,
    invalidReliefs:
      prayedReliefs.length > 0
        ? prayedReliefs
        : [
            "NOT_DETERMINED — no validated remedy rule graph is available; human legal review required.",
          ],
  };
}
