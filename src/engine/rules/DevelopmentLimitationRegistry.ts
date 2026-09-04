import type {
  LimitationRule,
  LimitationRuleRegistry,
} from "./LimitationContracts";

/**
 * Development limitation registry.
 *
 * IMPORTANT:
 * - This registry is the legal-rule source of truth for limitation metadata.
 * - ClaimType is candidate routing only.
 * - Applicability must still be evaluated from verified facts.
 * - Temporal versions are explicit; no implicit "current law" selection.
 */
const LIMITATION_RULES: readonly LimitationRule[] = [
  {
    ruleId: "BD-LIM-ARTICLE-113",
    article: "ARTICLE_113",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit for specific performance of a contract: Article 113 temporal rule.",
    applicability: {
      claimType: "SPECIFIC_PERFORMANCE",
      requiredPredicates: ["Execution Date", "Refusal Date"],
    },
    accrualTrigger: "REFUSAL_DATE",
    temporalVersions: [
      {
        effectiveFrom: "2005-01-01",
        limitationPeriodYears: 1,
      },
    ],
  },
  {
    ruleId: "BD-LIM-ARTICLE-142",
    article: "ARTICLE_142",
    statute: "LIMITATION_ACT_1908",
    description:
      "Recovery of possession of immovable property based on dispossession or discontinuance of possession.",
    applicability: {
      claimType: "DECLARATION_AND_POSSESSION",
      requiredPredicates: ["Dispossession Date"],
    },
    accrualTrigger: "DISPOSSESSION_DATE",
    temporalVersions: [
      {
        effectiveFrom: "1908-01-01",
        limitationPeriodYears: 12,
      },
    ],
  },
  {
    ruleId: "BD-LIM-ARTICLE-120",
    article: "ARTICLE_120",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit for which no period is otherwise provided: right to sue accrual rule.",
    applicability: {
      claimType: "DECLARATION_AND_POSSESSION",
      requiredPredicates: ["Right to Sue Date"],
    },
    accrualTrigger: "RIGHT_TO_SUE_DATE",
    temporalVersions: [
      {
        effectiveFrom: "1908-01-01",
        limitationPeriodYears: 6,
      },
    ],
  },
  {
    ruleId: "BD-LIM-ARTICLE-149",
    article: "ARTICLE_149",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit by or on behalf of the Government: special limitation period rule.",
    applicability: {
      claimType: "GENERAL_CIVIL",
      requiredPredicates: ["Right to Sue Date"],
    },
    accrualTrigger: "RIGHT_TO_SUE_DATE",
    temporalVersions: [
      {
        effectiveFrom: "1908-01-01",
        limitationPeriodYears: 60,
      },
    ],
  },
];

export class DevelopmentLimitationRegistry
  implements LimitationRuleRegistry
{
  getRules(): readonly LimitationRule[] {
    return LIMITATION_RULES;
  }

  getCandidateRules(claimType: string): readonly LimitationRule[] {
    return LIMITATION_RULES.filter(
      (rule) => rule.applicability.claimType === claimType,
    );
  }
}
