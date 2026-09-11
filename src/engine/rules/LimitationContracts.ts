import type { Tristate } from "../../types/types";
import type { StatuteSource } from "../citations/StatuteContracts";

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
  /**
   * P6-01: Linked to authoritative statute source ID.
   * No rule may reference a statute string that is not registered 
   * in the StatuteRegistry.
   */
  statute: StatuteSource["sourceId"];
  description: string;
  applicability: LimitationApplicability;
  accrualTrigger: LimitationAccrualTrigger;
  temporalVersions: readonly LimitationTemporalVersion[];
};

export type LimitationRuleRegistry = {
  version: string;
  authorityStatus: "VALIDATED_PRODUCTION" | "DEVELOPMENT_FIXTURE";
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
