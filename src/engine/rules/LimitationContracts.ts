import type { Tristate } from "../../types/types";

export type LimitationArticle =
  | "ARTICLE_113"
  | "ARTICLE_120"
  | "ARTICLE_142"
  | "ARTICLE_144"
  | "ARTICLE_149";

export type LimitationAccrualTrigger =
  | "REFUSAL_DATE"
  | "DISPOSSESSION_DATE"
  | "RIGHT_TO_SUE_DATE"
  | "DEATH_DATE"
  | "DEMAND_DATE";

export type LimitationTemporalVersion = {
  effectiveFrom: string;
  effectiveTo?: string;
  limitationPeriodYears: number;
};

export type LimitationApplicability = {
  claimType: string;
  requiredPredicates: string[];
  excludedPredicates?: string[];
};

export type LimitationRule = {
  ruleId: string;
  article: LimitationArticle;
  statute: "LIMITATION_ACT_1908";
  description: string;
  applicability: LimitationApplicability;
  accrualTrigger: LimitationAccrualTrigger;
  temporalVersions: LimitationTemporalVersion[];
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
