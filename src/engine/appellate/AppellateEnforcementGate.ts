import { evaluateAppellateForum } from "./AppellateForumEvaluator";
import { calculateAppellateLimitation } from "./AppellateLimitationCalculator";
import { validateAppellateGrounds } from "./AppellateGroundsValidator";
import type { AppellateForum, AppellateRemedyType } from "./AppellateContracts";

/**
 * P9-05: Appellate Enforcement Gate.
 * 
 * Single source of truth for appellate validation. Combines forum, 
 * limitation, and grounds checks. Fails closed if any appellate defect is detected.
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
    defects.push({ category: "FORUM", description: forumVerdict.reason });
  }

  // 2. Limitation Check
  const limitationVerdict = calculateAppellateLimitation(input.remedyType, input.decreeDate);
  if (!limitationVerdict) {
    defects.push({ category: "LIMITATION", description: "No limitation rule found for the remedy type." });
  } else {
    limitationExpiryDate = limitationVerdict.expiryDate;
    if (!limitationVerdict.expiryDate) {
      defects.push({ category: "LIMITATION", description: limitationVerdict.reason });
    }
  }

  // 3. Grounds Check
  const groundsVerdict = validateAppellateGrounds(input.remedyType, input.assertedGrounds);
  if (!groundsVerdict.isValid) {
    for (const invalid of groundsVerdict.invalidGrounds) {
      defects.push({ category: "GROUNDS", description: `Invalid ground asserted for ${input.remedyType}: ${invalid}` });
    }
  }

  return {
    isValid: defects.length === 0,
    defects,
    limitationExpiryDate,
  };
}
