import type {
  LimitationRule,
  LimitationRuleRegistry,
} from "./LimitationContracts";

/**
 * Development limitation registry.
 * Legal-rule source of truth for limitation metadata.
 *
 * P5-15.11 Forensic Gate:
 * Array ordered by Article number. ARTICLE_149 is retained at the bottom
 * for historical audit but explicitly marked SUSPENDED.
 */
const LIMITATION_RULES: readonly LimitationRule[] = [
  {
    ruleId: "BD-LIM-ARTICLE-91",
    article: "ARTICLE_91",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit to cancel or set aside an instrument: three years from knowledge of the facts entitling the plaintiff to cancellation or setting aside.",
    applicability: {
      claimTypes: [
        "CANCELLATION",
        "SET_ASIDE",
        "GENERAL_CIVIL",
      ],
      requiredPredicates: [
        { predicate: "Relief", object: "CANCELLATION_OR_SET_ASIDE" },
        { predicate: "Instrument" },
        { predicate: "Cancellation Entitlement Facts" },
        { predicate: "Knowledge Date" },
      ],
    },
    accrualTrigger: "KNOWLEDGE_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 3 },
    ],
  },

  {
    ruleId: "BD-LIM-ARTICLE-92",
    article: "ARTICLE_92",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit for declaration that an instrument is forged: three years from knowledge of the issue or registration.",
    applicability: {
      claimTypes: [
        "FORGERY_DECLARATION",
        "DECLARATION",
        "GENERAL_CIVIL",
      ],
      requiredPredicates: [
        { predicate: "Relief", object: "FORGERY_DECLARATION" },
        { predicate: "Instrument" },
        { predicate: "Issue Or Registration Event" },
        { predicate: "Knowledge Date" },
      ],
    },
    accrualTrigger: "KNOWLEDGE_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 3 },
    ],
  },

  {
    ruleId: "BD-LIM-ARTICLE-113",
    article: "ARTICLE_113",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit for specific performance of a contract. Current period is one year from the fixed performance date, or where no time is fixed, from notice of refusal.",
    applicability: {
      claimTypes: ["SPECIFIC_PERFORMANCE"],
      requiredPredicates: [
        { predicate: "Relief", object: "SPECIFIC_PERFORMANCE" },
        { predicate: "Contract" },
      ],
      alternativePredicateGroups: [
        [
          { predicate: "Performance Date" },
          { predicate: "Fixed Performance Date", object: "YES" },
        ],
        [
          { predicate: "Refusal Date" },
          { predicate: "Fixed Performance Date", object: "NO" },
        ],
      ],
    },
    accrualTrigger: "FIXED_PERFORMANCE_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", effectiveTo: "2005-06-30", limitationPeriodYears: 3 },
      { effectiveFrom: "2005-07-01", limitationPeriodYears: 1 },
    ],
  },

  // >>> INSERT NEW ARTICLE_114 HERE
  {
    ruleId: "BD-LIM-ARTICLE-114",
    article: "ARTICLE_114",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit for possession of immovable property not otherwise specifically provided for: twelve years from the date of dispossession or discontinuance.",
    applicability: {
      claimTypes: [
        "RECOVERY_OF_POSSESSION",
        "DECLARATION_AND_POSSESSION",
        "GENERAL_CIVIL",
      ],
      requiredPredicates: [
        { predicate: "Relief", object: "RECOVERY_OF_POSSESSION" },
        { predicate: "Plaintiff Possessory Entitlement" },
        { predicate: "Dispossession Date" },
      ],
    },
    accrualTrigger: "DISPOSSESSION_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 12 },
    ],
  },

  // >>> INSERT NEW ARTICLE_115 HERE
  {
    ruleId: "BD-LIM-ARTICLE-115",
    article: "ARTICLE_115",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit by a remainderman, reversioner, or remainderman for possession of immovable property: twelve years from the date of dispossession.",
    applicability: {
      claimTypes: [
        "RECOVERY_OF_POSSESSION",
        "DECLARATION_AND_POSSESSION",
        "GENERAL_CIVIL",
      ],
      requiredPredicates: [
        { predicate: "Relief", object: "RECOVERY_OF_POSSESSION" },
        { predicate: "Plaintiff Capacity", object: "REMAINDERMAN_OR_REVERSIONER" },
        { predicate: "Dispossession Date" },
      ],
    },
    accrualTrigger: "DISPOSSESSION_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 12 },
    ],
  },

  // >>> INSERT NEW ARTICLE_116 HERE
  {
    ruleId: "BD-LIM-ARTICLE-116",
    article: "ARTICLE_116",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit by a landlord to recover possession from a tenant: twelve years from the date of dispossession or expiration of the term.",
    applicability: {
      claimTypes: [
        "RECOVERY_OF_POSSESSION",
        "GENERAL_CIVIL",
      ],
      requiredPredicates: [
        { predicate: "Relief", object: "RECOVERY_OF_POSSESSION" },
        { predicate: "Plaintiff Capacity", object: "LANDLORD" },
        { predicate: "Dispossession Date" },
      ],
    },
    accrualTrigger: "DISPOSSESSION_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 12 },
    ],
  },

  {
    ruleId: "BD-LIM-ARTICLE-120",
    article: "ARTICLE_120",
    statute: "LIMITATION_ACT_1908",
    description:
      "Residual six-year limitation where no more specific limitation period is provided; accrual is when the right to sue accrues.",
    applicability: {
      claimTypes: [
        "DECLARATION",
        "GENERAL_CIVIL",
        "DECLARATION_AND_POSSESSION",
        "CANCELLATION",
        "SET_ASIDE",
        "FORGERY_DECLARATION",
        "INHERITANCE_CONSULTATION",
      ],
      requiredPredicates: [
        { predicate: "Right to Sue Date" },
      ],
      residualRule: true,
    },
    accrualTrigger: "RIGHT_TO_SUE_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 6 },
    ],
  },

  {
    ruleId: "BD-LIM-ARTICLE-142",
    article: "ARTICLE_142",
    statute: "LIMITATION_ACT_1908",
    description:
      "Recovery of khas possession in the relevant dispossession/discontinuance cases: twelve years from the date of dispossession or discontinuance.",
    applicability: {
      claimTypes: [
        "RECOVERY_OF_POSSESSION",
        "DECLARATION_AND_POSSESSION",
      ],
      requiredPredicates: [
        { predicate: "Relief", object: "RECOVERY_OF_POSSESSION" },
        { predicate: "Plaintiff Possessory Entitlement" },
        { predicate: "Dispossession Date" },
      ],
    },
    accrualTrigger: "DISPOSSESSION_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 12 },
    ],
  },

  // >>> INSERT NEW ARTICLE_144 HERE
  {
    ruleId: "BD-LIM-ARTICLE-144",
    article: "ARTICLE_144",
    statute: "LIMITATION_ACT_1908",
    description:
      "Suit by or on behalf of the Government to recover possession of property: twelve years from the date of dispossession.",
    applicability: {
      claimTypes: [
        "RECOVERY_OF_POSSESSION",
        "GOVERNMENT_SUIT",
        "GENERAL_CIVIL",
      ],
      requiredPredicates: [
        { predicate: "Plaintiff Capacity", object: "GOVERNMENT" },
        { predicate: "Relief", object: "RECOVERY_OF_POSSESSION" },
        { predicate: "Dispossession Date" },
      ],
    },
    accrualTrigger: "DISPOSSESSION_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", limitationPeriodYears: 12 },
    ],
  },

  // existing ARTICLE_149 (SUSPENDED - retained for audit history)
  {
    ruleId: "BD-LIM-ARTICLE-149-SUSPENDED",
    article: "ARTICLE_149",
    statute: "LIMITATION_ACT_1908",
    description:
      "SUSPENDED P5-15.10: Suit by or on behalf of the Government: sixty years, subject to the statutory qualification applicable to the underlying cause.",
    applicability: {
      claimTypes: [
        "GENERAL_CIVIL",
        "GOVERNMENT_SUIT",
      ],
      requiredPredicates: [
        { predicate: "Plaintiff Capacity", object: "GOVERNMENT" },
        { predicate: "Right to Sue Date" },
      ],
      // Excluded from active candidate selection via residual/exclusion flags if needed
      residualRule: false,
    },
    accrualTrigger: "RIGHT_TO_SUE_DATE",
    temporalVersions: [
      { effectiveFrom: "1908-01-01", effectiveTo: "2024-01-01", limitationPeriodYears: 60 },
    ],
  },
];

export class DevelopmentLimitationRegistry implements LimitationRuleRegistry {
  readonly version = "DEVELOPMENT-LIMITATION-FIXTURE-1.0.0";
  readonly authorityStatus = "DEVELOPMENT_FIXTURE" as const;

  getRules(): readonly LimitationRule[] {
    return LIMITATION_RULES;
  }

  getCandidateRules(claimType: string): readonly LimitationRule[] {
    return LIMITATION_RULES.filter((rule) =>
      rule.applicability.claimTypes.includes(claimType),
    );
  }
}
