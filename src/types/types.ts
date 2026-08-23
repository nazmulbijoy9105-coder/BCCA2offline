import { AuthUser, LicenseData } from "./auth.types";

// ============================================================================
// 4.4.0-HARDENED CORE TYPES
// ============================================================================

export interface EngineInput {
  factPattern: string;
  focusDomain?: string;
  submissionDate?: string;
}

export enum Tristate { TRUE = "TRUE", FALSE = "FALSE", UNKNOWN = "UNKNOWN" }

export enum AssertionType {
  ASSERTED = "ASSERTED",
  ADMITTED = "ADMITTED",
  DENIED = "DENIED",
  ALLEGED = "ALLEGED",
  INFERRED = "INFERRED",
}

export enum AssertionPolarity {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE",
  DISPUTED = "DISPUTED",
  UNKNOWN = "UNKNOWN",
}

export enum ValidationStatus {
  UNVERIFIED = "UNVERIFIED",
  VERIFIED = "VERIFIED",
  CONTRADICTED = "CONTRADICTED",
  REQUIRES_HUMAN_REVIEW = "REQUIRES_HUMAN_REVIEW",
}

export enum ExtractionStatus {
  NOT_EXECUTED = "NOT_EXECUTED",
  EXTRACTED = "EXTRACTED",
  PARTIAL = "PARTIAL",
  FAILED = "FAILED",
}

export enum SourceStatus {
  UNRESOLVED = "UNRESOLVED",
  IDENTIFIED = "IDENTIFIED",
  SOURCE_VERIFIED = "SOURCE_VERIFIED",
}

export enum AuthenticationStatus {
  NOT_EXECUTED = "NOT_EXECUTED",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  AUTHENTICATED = "AUTHENTICATED",
  REQUIRES_HUMAN_REVIEW = "REQUIRES_HUMAN_REVIEW",
}

export enum CorroborationStatus {
  NOT_EXECUTED = "NOT_EXECUTED",
  UNCORROBORATED = "UNCORROBORATED",
  CORROBORATED = "CORROBORATED",
  CONTRADICTED = "CONTRADICTED",
}

export enum HumanValidationStatus {
  NOT_EXECUTED = "NOT_EXECUTED",
  NOT_VALIDATED = "NOT_VALIDATED",
  VALIDATED = "VALIDATED",
  REQUIRES_REVIEW = "REQUIRES_REVIEW",
}

export enum FactConfidence { CANDIDATE = "CANDIDATE", SUPPORTED = "SUPPORTED", VERIFIED = "VERIFIED" }
export enum GateStatus { PASS = "PASS", FAIL = "FAIL", INDETERMINATE = "INDETERMINATE", HALT = "HALT" }

export type RuleExecutionStatus = "NOT_EXECUTED" | "BLOCKED" | "UNKNOWN" | "FAILED" | "SATISFIED";

export type CitationState =
  | "NOT_EXECUTED"
  | "UNRESOLVED"
  | "RESOLVED"
  | "TEXT_VERIFIED"
  | "PROPOSITION_SUPPORTED"
  | "TEMPORALLY_VALID"
  | "JURISDICTION_VALID";

export type ClaimType =
  | "SPECIFIC_PERFORMANCE"
  | "DECLARATION_AND_POSSESSION"
  | "INHERITANCE_CONSULTATION"
  | "GENERAL_CIVIL";

// ============================================================================
// PROVENANCE / SEMANTIC OBJECTS (P1 — ILRMF)
// ============================================================================

export interface SourceSpan {
  documentId: string;
  segment: string;
  page?: number;
  paragraph?: number;
  lineStart?: number;
  lineEnd?: number;
  charStart?: number;
  charEnd?: number;
  sourceType?: "INPUT_NARRATIVE" | "PLEADING" | "DOCUMENT" | "ORDER" | "JUDGMENT" | "OTHER";
  extractionMethod?: "PATTERN" | "STRUCTURED_INPUT" | "MANUAL_VALIDATION" | "DOCUMENT_VALIDATION";
}

export interface Proposition {
  propositionId: string;
  subject: string;
  predicate: string;
  object: string | null;
  canonicalKey: string;
  text: string;
}

export interface Assertion {
  assertionId: string;
  propositionId: string;
  assertionType: AssertionType;
  polarity: AssertionPolarity;
  truth: Tristate;
  assertedBy?: string;
  sourceSpan: SourceSpan;
}

export interface ValidationDimensions {
  extractionStatus: ExtractionStatus;
  sourceStatus: SourceStatus;
  authenticationStatus: AuthenticationStatus;
  corroborationStatus: CorroborationStatus;
  humanValidationStatus: HumanValidationStatus;
}

export interface AtomicFact {
  sourceParagraph?: string;
  materiality?: string;
  temporalStatus?: string;
  factStatus?: string;
  value?: unknown;
  factId: string;
  propositionId: string;
  assertionId: string;
  proposition: string;
  subject: string;
  predicate: string;
  object: string | null;
  truth: Tristate;
  polarity: AssertionPolarity;
  source: SourceSpan;
  assertionType: AssertionType;
  validationStatus: ValidationStatus;
  confidence: FactConfidence;
  assertedBy?: string;
  eventDate?: string | null;
  normalizedValue?: string | number | boolean | null;
  contradicts?: string[];
  supports?: string[];
  disputedProposition?: string;
  validation: ValidationDimensions;
}

export interface ContradictionEdge {
  edgeId: string;
  propositionKey: string;
  leftFactId: string;
  rightFactId: string;
  relation: "DIRECT_TRUTH_CONFLICT";
  status: "CRITICAL" | "PENDING_VALIDATION";
}

// ============================================================================
// AUTHORITY / RULE GRAPH (P2)
// ============================================================================

export interface AuthorityRef {
  authorityId?: string;
  act: string;
  section: string;
  citation?: string;
}

export interface RulePredicate {
  predicateId: string;
  subject: string;
  predicate: string;
  object?: string;
  requiredTruth: Tristate;
  requireVerified: boolean;
  authorityIds?: string[];
}

export interface LegalRule {
  ruleId: string;
  ruleVersion: string;
  jurisdiction: string;
  effectiveFrom: string;
  effectiveTo?: string;
  claimTypes: ClaimType[];
  ruleType:
    | "ELEMENT" | "BAR" | "EXCEPTION" | "BURDEN" | "PRESUMPTION"
    | "LIMITATION" | "JURISDICTION" | "PROCEDURE" | "RELIEF";
  predicates: RulePredicate[];
  logicalOperator: "ALL" | "ANY" | "AT_LEAST_N";
  atLeastN?: number;
  burden?: { party: "PLAINTIFF" | "DEFENDANT"; standard: string };
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

export interface RuleRegistry {
  version: string;
  identity: RuleGraphIdentity;
  getClaimElements(claimType: ClaimType, jurisdiction: string): LegalRule[];
  getLegislationMapping(claimType: ClaimType): {
    primaryAct: string | null;
    relevantSections: Array<{ actName: string; sectionOrRule: string; purpose: string }>;
  };
}

// ============================================================================
// EXECUTION RESULTS
// ============================================================================

export interface PredicateExecutionResult {
  predicateSubject: string;
  predicateId: string;
  status: "TRUE" | "FALSE" | "UNKNOWN";
  factIds: string[];
}

export interface RuleExecutionResult {
  ruleId: string;
  status: RuleExecutionStatus;
  predicateResults: PredicateExecutionResult[];
  authorityIds: string[];
  burden?: { party: "PLAINTIFF" | "DEFENDANT"; standard: string };
  legalEffect?: string;
  explanationCode: string;
}

export interface CitationValidationAudit {
  totalCitations: number;
  verifiedCount: number;
  rejectedCount: number;
  validationStandard: string;
  auditStatus: CitationState;
  registrySignature: string;
  note: string;
  citationStates: Array<{ citation: string; state: CitationState }>;
}

// ============================================================================
// AUDIT / FORENSIC CHAIN (P4)
// ============================================================================

export interface AuditRecordPayload {
  caseId: string;
  rawInputHash: string;
  extractionHash: string;
  inputHash: string;
  factRegistryHash: string;
  timelineHash: string;
  eventTimelineHash: string;
  corpusIdentity: RuleGraphIdentity;
  corpusDigest: string;
  ruleRegistryVersion: string;
  ruleRegistryHash: string;
  executionTraceHash: string;
  outputHash: string;
  manifest: {
    engineVersion: string;
    factSchemaVersion: string;
    ruleGraphVersion: string;
    ruleSetVersion: string;
    lawCorpusVersion: string;
    citationRegistryVersion: string;
    executionMode: string;
    statelessExecution: boolean;
    defaultFactsAllowed: boolean;
    unknownCollapseToFalse: boolean;
    autonomousDecreeAuthorization: boolean;
    corpusMode: "DEVELOPMENT" | "VALIDATED_PRODUCTION";
    auditMode: string;
  };
  executionMilliseconds: number;
  analyzedByUserId: string;
  outcome: "SUCCESS" | "INDETERMINATE" | "HALTED" | "ERROR";
}

export interface AuditRecord extends AuditRecordPayload {
  previousHash: string | null;
  recordHash: string;
}

export interface AuditSink {
  append(payload: AuditRecordPayload): Promise<AuditRecord>;
}

export interface LicenseValidator {
  validate(user: AuthUser, license: { licenseId: string; issuedTo: string }): Promise<{ valid: boolean; reason?: string }>;
  isProductionReady?: boolean;
}

export interface FactValidationProvider {
  validateFacts(input: {
    facts: AtomicFact[];
    propositions: Proposition[];
    assertions: Assertion[];
  }): Promise<AtomicFact[]>;
  isProductionReady?: boolean;
}

// ============================================================================
// BACKWARD-COMPATIBLE UI TYPES (v2.x → 4.4.0 bridge)
// ============================================================================

export interface FactConflict {
  conflictId: string;
  conflictType:
    | "TEMPORAL_STATUS_CONTRADICTION"
    | "CHRONOLOGY_DATE_CLASH"
    | "CAUSE_OF_ACTION_MUTUAL_EXCLUSION"
    | "PARTY_ROLE_INCONSISTENCY"
    | "PROPERTY_STATUS_COLLISION"
    | "EVIDENTIARY_ABSENCE";
  severity: "CRITICAL" | "MATERIAL" | "SECONDARY";
  factIdA: string;
  factIdB?: string;
  description: string;
  affectedGateways: number[];
  resolutionRequirement: string;
}

export interface FactConsistencyGateOutput {
  gateStatus: "CONSISTENT" | "CONDITIONALLY_CONSISTENT" | "HALT_CRITICAL_CONFLICT";
  certification: "GREEN" | "AMBER" | "RED" | "BLACK";
  summary: string;
  atomicFacts: AtomicFact[];
  conflicts: FactConflict[];
  criticalConflictCount: number;
  materialConflictCount: number;
  missingDocumentsCount: number;
  verifiedRulesCount: number;
  verifiedAuthoritiesCount: number;
  readinessScore: number;
  auditTrail: Array<{
    checkId: string;
    checkName: string;
    status: "PASS" | "WARN" | "FAIL";
    details: string;
  }>;
}

export interface CaseHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  primaryDomain: string;
  courtLevel: string | null;
  isTimeBarred: boolean;
  factPattern: string;
  focusDomain: string;
  analysis: CaseAnalysisResponse;
  encrypted: boolean;
  accessLog: Array<{ userId: string; accessedAt: number; action: string }>;
}

export interface CaseAnalysisResponse {
  gateF0?: FactConsistencyGateOutput;
  stage0: {
    factualSummary: string;
    chronology: Array<{
      date: string;
      event: string;
      partiesInvolved: string;
      factualSource: string;
    }>;
    admittedFacts: string[];
    disputedFacts: string[];
    unknownFacts: Array<{
      category: string;
      factDescription: string;
      status: "MISSING_FROM_RECORD" | "AMBIGUOUS_ASSERTION" | "UNVERIFIED_ORAL_CLAIM";
      recordSignificance: string;
    }>;
    quantumFacts: string[];
    factsMeta?: {
      category: "SPECIFIC_PERFORMANCE" | "DECLARATION_AND_POSSESSION" | "GENERAL_CIVIL" | "INHERITANCE_CONSULTATION";
      isRegisteredBainapatra: boolean | "unspecified";
      isBalanceDeposited: boolean | "unspecified";
      plaintiffHasRegisteredTitle: boolean | "unspecified";
      dispossessionProven: boolean | "unspecified";
      isUsingDefaultAmounts?: boolean;
    };
    // 4.4.0 forensic extensions (optional in UI)
    atomicFacts?: any[];
    propositions?: any[];
    assertions?: any[];
    contradictionGraph?: any[];
    eventTimeline?: any[];
    provenance?: any[];
  };
  stage1: {
    primaryDomain: string;
    subsidiaryDomains: string[];
    triggerFacts: Array<{
      domain: string;
      fact: string;
      statutoryTrigger: string;
    }>;
  };
  stage2: {
    primaryAct: string | null;
    relevantSections: Array<{
      actName: string;
      sectionOrRule: string;
      purpose: string;
    }>;
    precedents: Array<{
      citation: string;
      caseTitle?: string;
      court: string;
      decisionYear?: number;
      reporter?: string;
      volume?: number;
      page?: number;
      bench?: string;
      statutorySubject?: string;
      holding: string;
      relevance: string;
      ratioDecidendi?: string;
      verificationStatus: "VERIFIED_CANONICAL" | "FAILED_UNVERIFIED";
      verificationHash: string;
      isDeterministic?: boolean;
      securityHashToken?: string;
    }>;
    citationValidationAudit?: {
      totalCitations: number;
      verifiedCount: number;
      rejectedCount: number;
      validationStandard: string;
      auditStatus: CitationState | "PASS_100_PERCENT_DETERMINISTIC" | "FAIL_UNVERIFIED_DETECTED";
      registrySignature: string;
    };
    equityPrinciples: string[];
  };
  stage3: {
    accrualDate: string | null;
    prescribedPeriod: string | null;
    limitationArticle: string | null;
    isTimeBarred: boolean;
    exceptionsOrExtensions: string;
    preliminaryAnalysis: string | null;
    timelineValidation?: {
      agreementDate: string | null;
      refusalDate: string | null;
      isAgreementDateExtracted: boolean;
      isRefusalDateExtracted: boolean;
      calculationType: "real_refusal" | "heuristic_6_months" | "missing_dates" | "other_category";
      validationStatus: "valid" | "heuristic_applied" | "invalid_gaps";
      explanation: string;
    };
  };
  stage4: {
    plaintiffs: Array<{
      name: string;
      legalIdentity: string;
      capacity: string;
      causeOfActionAccess: string;
    }>;
    defendants: Array<{
      name: string;
      legalIdentity: string;
      capacity: string;
      liabilityType: string;
    }>;
    joinderIssues: string;
    locusStandiSummary: string | null;
  };
  stage5: {
    territorial: {
      rule: string | null;
      governingSection: string | null;
      jurisdictionalFacts: string | null;
    };
    pecuniary: {
      valuation: string | null;
      courtLevel: string | null;
      pecuniaryLimits: string | null;
      suitsValuationActNotes: string | null;
    };
    subjectMatter: {
      isExcluded: boolean;
      forum: string | null;
      governingStatute: string | null;
    };
    objectionStrategy: string | null;
  };
  stage6: {
    plaintChecklist: string[];
    groundsForRejection: string[];
    writtenStatementDeemedAdmissions: string;
    counterclaimsOrSetOff: string;
  };
  stage7: {
    issues: Array<{
      issueNo: number;
      title: string;
      type: string;
      burden: string;
      evidenceRequired: string;
    }>;
  };
  stage8: {
    evidenceList: Array<{
      item: string;
      source: string;
      type: string;
      governingSection: string | null;
      admissibilityChallenge: string;
    }>;
    burdenAssignments: string[];
    statutoryPresumptions: Array<{
      statuteSection: string;
      presumptionStyle: string;
      effectOnCase: string;
    }>;
  };
  stage9: {
    issueDetails: Array<{
      issueNo: number;
      issueTitle: string;
      plaintiffPosition: string;
      defendantPosition: string;
      courtAnalysis: string;
      projectedFinding: string;
    }>;
  };
  stage10: {
    applicablePrinciples: Array<{
      principle: string;
      application: string;
      weight: string;
    }>;
    discretionaryReliefCheck: string | null;
  };
  stage11: {
    timelineProgress: Array<{
      stageName: string;
      cpcReference: string;
      subActions: string;
      strategicPlay: string;
    }>;
  };
  stage12: {
    appealNodes: Array<{
      level: string;
      authority: string;
      scope: string;
      governingSection: string | null;
    }>;
  };
  stage13: {
    overview: string;
    reliefDecree: string | null;
    costsApportionment: string | null;
    equitableBars: string | null;
    _debug?: any;
    executionPathway: string | null;
  };
  _security?: {
    analyzedBy: string;
    analyzedAt: number;
    licenseId: string;
    forensicHash: string;
    engineVersion: string;
    caseId?: string;
  };
}
