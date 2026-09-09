import { evaluateAppellateForum } from "./AppellateForumEvaluator";
import { calculateAppellateLimitation } from "./AppellateLimitationCalculator";
import { validateAppellateGrounds } from "./AppellateGroundsValidator";
import type { AppellateForum, AppellateRemedyType } from "./AppellateContracts";

/**
 * P9-05: Appellate Enforcement Gate.
 *
 * Development/validation utility for appellate metadata. It must not be
 * treated as production legal authority. Production appellate outcomes
 * remain NOT_DETERMINED until validated production authority is supplied.
 */

export type AppellateEvaluationInput = {
  remedyType: AppellateRemedyType;
  proposedForum: AppellateForum;
  originatingForum?: AppellateForum;
  decreeDate: string | null;
  assertedGrounds: readonly string[];
};

export type AppellateDefect = {
  category: "FORUM" | "LIMITATION" | "GROUNDS";
  description: string;
};

export type AppellateEvaluationResult = {
  isValid: boolean;
  defects: AppellateDefect[];
  limitationExpiryDate: string | null;
};

export function enforceAppellateRules(input: AppellateEvaluationInput): AppellateEvaluationResult {
  const defects: AppellateDefect[] = [];
  let limitationExpiryDate: string | null = null;

  // 1. Forum Check
  const forumVerdict = evaluateAppellateForum(input.remedyType, input.proposedForum, input.originatingForum);
  if (!forumVerdict.isValid) {
    defects.push({
      category: "FORUM",
      description: forumVerdict.reason,
    });
  }

  // 2. Limitation Check
  const limitationVerdict = calculateAppellateLimitation(input.remedyType, input.decreeDate);
  if (!limitationVerdict) {
    defects.push({
      category: "LIMITATION",
      description:
        "NOT_DETERMINED — no validated production appellate limitation rule is available.",
    });
  } else {
    limitationExpiryDate = limitationVerdict.expiryDate;
    if (!limitationVerdict.expiryDate) {
      defects.push({
        category: "LIMITATION",
        description: limitationVerdict.reason,
      });
    }
  }

  // 3. Grounds Check
  const groundsVerdict = validateAppellateGrounds(input.remedyType, input.assertedGrounds);
  if (!groundsVerdict.isValid) {
    if (groundsVerdict.invalidGrounds.length === 0) {
      defects.push({
        category: "GROUNDS",
        description:
          "NOT_DETERMINED — no validated production appellate grounds rule is available.",
      });
    } else {
      for (const invalid of groundsVerdict.invalidGrounds) {
        defects.push({
          category: "GROUNDS",
          description:
            `Ground cannot be validated against a production appellate rule: ${invalid}`,
        });
      }
    }
  }

  return {
    isValid: defects.length === 0,
    defects,
    limitationExpiryDate,
  };
}
