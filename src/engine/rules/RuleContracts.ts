/**
 * Canonical legal-rule contracts.
 *
 * P5-13:
 * Single dependency-neutral contract surface for the executable
 * legal rule graph.
 *
 * Contracts only. No rule execution and no legal conclusions.
 */

export enum Tristate {
  TRUE = "TRUE",
  FALSE = "FALSE",
  UNKNOWN = "UNKNOWN",
}

export type LegalRuleType =
  | "ELEMENT"
  | "BAR"
  | "EXCEPTION"
  | "BURDEN"
  | "PRESUMPTION"
  | "LIMITATION"
  | "JURISDICTION"
  | "PROCEDURE"
  | "RELIEF";

export type RuleLogicalOperator = "ALL" | "ANY" | "AT_LEAST_N";

export type RuleAuthorityStatus =
  | "VALIDATED_PRODUCTION"
  | "DEVELOPMENT_FIXTURE";

export interface AuthorityRef {
  authorityId?: string;
  act: string;
  section: string;
  citation?: string;
}

export type ExtractionRequirement = "NOT_EXECUTED" | "EXTRACTED" | "PARTIAL" | "FAILED";
export type SourceRequirement = "UNRESOLVED" | "IDENTIFIED" | "SOURCE_VERIFIED";
export type AuthenticationRequirement = "NOT_EXECUTED" | "UNAUTHENTICATED" | "AUTHENTICATED" | "REQUIRES_HUMAN_REVIEW";
export type CorroborationRequirement = "NOT_EXECUTED" | "UNCORROBORATED" | "CORROBORATED" | "CONTRADICTED";
export type HumanValidationRequirement = "NOT_EXECUTED" | "NOT_VALIDATED" | "VALIDATED" | "REQUIRES_REVIEW";

export interface ValidationRequirements {
  extractionRequired: boolean;
  sourceRequired: SourceRequirement;
  authenticationRequired: AuthenticationRequirement;
  corroborationRequired: CorroborationRequirement;
  humanValidationRequired: HumanValidationRequirement;
}

export interface RulePredicate {
  predicateId: string;
  subject: string;
  predicate: string;
  object?: string;
  requiredTruth: Tristate;
  requireVerified?: boolean;
  validationRequirements?: ValidationRequirements;
  authorityIds?: string[];
}

export interface RuleBurden {
  party: "PLAINTIFF" | "DEFENDANT";
  standard: string;
}

export interface LegalRule {
  ruleId: string;
  ruleVersion: string;
  jurisdiction: string;
  effectiveFrom: string;
  effectiveTo?: string;
  claimTypes: string[];
  ruleType: LegalRuleType;
  predicates: RulePredicate[];
  logicalOperator: RuleLogicalOperator;
  atLeastN?: number;
  burden?: RuleBurden;
  outcomeIfSatisfied: string;
  outcomeIfFailed: string;
  legalEffect?: string;
  authority: AuthorityRef;
  supersedes?: string[];
  exceptions?: string[];
  priority?: number;
}

export interface RuleGraphIdentity {
  corpusId: string;
  corpusVersion: string;
  corpusDigest: string;
  authorityRegistryVersion: string;
  authorityRegistryDigest: string;
  ruleGraphVersion: string;
  ruleGraphDigest: string;
}

export interface LegislationMapping {
  primaryAct: string | null;
  relevantSections: Array<{
    actName: string;
    sectionOrRule: string;
    purpose: string;
  }>;
}

export interface RuleRegistry {
  version: string;
  identity: RuleGraphIdentity;
  authorityStatus: RuleAuthorityStatus;

  getClaimElements(
    claimType: string,
    jurisdiction: string,
  ): LegalRule[];

  getLegislationMapping(
    claimType: string,
  ): LegislationMapping;
}

export interface PredicateConflictFact {
  factId: string;
  object: string | null;
  truth: Tristate;
}

export interface PredicateExecutionResult {
  predicateSubject: string;
  predicateId: string;
  status: Tristate;
  factIds: string[];
  conflictDetected?: boolean;
  sameFamilyConflictingFacts?: PredicateConflictFact[];
}

export type RuleExecutionStatus =
  | "NOT_EXECUTED"
  | "BLOCKED"
  | "UNKNOWN"
  | "FAILED"
  | "SATISFIED";

export interface RuleExecutionResult {
  ruleId: string;
  status: RuleExecutionStatus;
  predicateResults: PredicateExecutionResult[];
  authorityIds: string[];
  burden?: RuleBurden;
  legalEffect?: string;
  explanationCode: string;
  authorityStatus: RuleAuthorityStatus;
}
