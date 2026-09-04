import type { Tristate } from "../../types/types";

export type LimitationArticle =
  | "ARTICLE_91"
  | "ARTICLE_92"
  | "ARTICLE_113"
  | "ARTICLE_114"
  | "ARTICLE_115"
  | "ARTICLE_116"
  | "ARTICLE_120"
  | "ARTICLE_142"
  | "ARTICLE_144"
  | "ARTICLE_149";

export type LimitationAccrualTrigger =
  | "FIXED_PERFORMANCE_DATE"
  | "REFUSAL_DATE"
  | "KNOWLEDGE_DATE"
  | "DISPOSSESSION_DATE"
  | "RIGHT_TO_SUE_DATE"
  | "DEMAND_DATE";

export type LimitationTemporalVersion = {
  effectiveFrom: string;
  effectiveTo?: string;
  limitationPeriodYears: number;
};

export type LimitationPredicate = {
  predicate: string;
  object?: string;
  requiredState?: Tristate;
};

export type LimitationApplicability = {
  claimTypes: readonly string[];
  requiredPredicates?: readonly LimitationPredicate[];
  alternativePredicateGroups?: readonly (readonly LimitationPredicate[])[];
  excludedPredicates?: readonly LimitationPredicate[];
  residualRule?: boolean;
};

export type LimitationRule = {
  ruleId: string;
  article: LimitationArticle;
  statute: "LIMITATION_ACT_1908";
  description: string;
  applicability: LimitationApplicability;
  accrualTrigger: LimitationAccrualTrigger;
  temporalVersions: readonly LimitationTemporalVersion[];
};

export type LimitationRuleRegistry = {
  getRules(): readonly LimitationRule[];
  getCandidateRules(claimType: string): readonly LimitationRule[];
};

export type LimitationFact = {
  predicate: string;
  object?: string;
  eventDate?: string;
  state?: Tristate;
  verified?: boolean;
};
