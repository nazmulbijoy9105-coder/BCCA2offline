import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";
import type { AppellateForum, AppellateRemedyType, AppellateRule } from "./AppellateContracts";

const registry = new DevelopmentAppellateRegistry();

/**
 * P9-02: Appellate Forum Evaluator.
 * 
 * Deterministically evaluates whether a proposed appellate forum is 
 * correct for a given remedy type, and verifies that the prerequisite 
 * (originating) forum matches the registry rules.
 */

export type ForumVerdict = {
  isValid: boolean;
  reason: string;
  matchedRule?: AppellateRule;
};

export function evaluateAppellateForum(
  remedyType: AppellateRemedyType,
  proposedForum: AppellateForum,
  originatingForum?: AppellateForum
): ForumVerdict {
  const candidateRules = registry.getCandidateRules(remedyType);

  if (candidateRules.length === 0) {
    return {
      isValid: false,
      reason: `No appellate rules found for remedy type: ${remedyType}`,
    };
  }

  // Find the rule that matches the proposed forum
  const matchedRule = candidateRules.find(
    (rule) => rule.forum.primaryForum === proposedForum
  );

  if (!matchedRule) {
    return {
      isValid: false,
      reason: `Forum ${proposedForum} is not authorized for remedy type ${remedyType}.`,
    };
  }

  // Check prerequisite (originating) forum if defined in the rule
  if (matchedRule.forum.prerequisiteForum) {
    if (!originatingForum) {
      return {
        isValid: false,
        reason: `Originating forum is required to verify prerequisite for ${remedyType}.`,
        matchedRule,
      };
    }

    if (matchedRule.forum.prerequisiteForum !== originatingForum) {
      return {
        isValid: false,
        reason: `Prerequisite violation: ${remedyType} to ${proposedForum} requires originating forum to be ${matchedRule.forum.prerequisiteForum}, but got ${originatingForum}.`,
        matchedRule,
      };
    }
  }

  return {
    isValid: true,
    reason: "Appellate forum and prerequisites verified.",
    matchedRule,
  };
}
