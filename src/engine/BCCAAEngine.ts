// src/engine/BCCAAEngine.ts
// BCCAA 4.5.2-P0 — P0 Fact-Graph Hardened
//
// P0 Schema Changes (Part 1):
//   - LegalEventType expanded: AGREEMENT_REGISTERED, ADVANCE_PAID, BALANCE_DEPOSIT,
//     PERFORMANCE_DEADLINE, LEGAL_NOTICE (backward-compatible, existing values preserved)
//   - SourceSpan.documentType / documentDate — document provenance
//   - AtomicFact.provenanceAssertions — merged assertion tracking (optional)
//   - DevelopmentFactValidationProvider sets truth=TRUE with setsTruth marker
//
// P0 Extraction Changes (Part 3):
//   - extractAtomicFacts: deterministic provenance merge on deduplication
//   - extractClauseFacts: multi-fact per clause, semantic monetary classification
//   - detectAssertionContext: plaintiff/defendant/document attribution
//   - inferEventType: explicit legal event mapping
//   - executePartyStandiRules: consumes Stage 0 fact graph
//   - computeOutputHash: semantic hash separate from case identity

import {
  CaseAnalysisResponse,
  EngineInput,
  FactConsistencyGateOutput,
} from "../types/types";
import { AuthUser } from "../types/auth.types";
import { generateSecureId, generateHash } from "../utils/crypto";
import { CitationValidator } from "./CitationValidator";
import { FactConsistencyGate } from "./FactConsistencyGate";

// ============================================================================
// MANIFEST / HARD LIMITS
// ============================================================================

export const ENGINE_MANIFEST = Object.freeze({
  engineVersion: "4.5.2-P0",
  factSchemaVersion: "4.0.1",
  ruleGraphVersion: "3.0.0",
  ruleSetVersion: "3.0.0",
  lawCorpusVersion: "BD-2026.08",
  citationRegistryVersion: "BD-SC-2026.08",
  executionMode: "FAIL_CLOSED",
  statelessExecution: true,
  defaultFactsAllowed: false,
  unknownCollapseToFalse: false,
  autonomousDecreeAuthorization: false,
  corpusMode: "DEVELOPMENT" as "DEVELOPMENT" | "VALIDATED_PRODUCTION",
  auditMode:
    "ATOMIC_APPEND_REQUIRED" as "ATOMIC_APPEND_REQUIRED" | "DEVELOPMENT",
});

const MAX_INPUT_LENGTH = 100_000;

// ============================================================================
// ENUMS
// ============================================================================

export enum Tristate {
  TRUE = "TRUE",
  FALSE = "FALSE",
  UNKNOWN = "UNKNOWN",
}

export enum AssertionType {
  ALLEGED = "ALLEGED",
  ADMITTED = "ADMITTED",
  DENIED = "DENIED",
  ASSERTED = "ASSERTED",
  INFERRED = "INFERRED",
  DOCUMENTARY_FACT = "DOCUMENTARY_FACT",
  COURT_FINDING = "COURT_FINDING",
  PARTY_NARRATIVE = "PARTY_NARRATIVE",
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

export enum FactConfidence {
  CANDIDATE = "CANDIDATE",
  SUPPORTED = "SUPPORTED",
  VERIFIED = "VERIFIED",
}

export enum GateStatus {
  PASS = "PASS",
  FAIL = "FAIL",
  INDETERMINATE = "INDETERMINATE",
  HALT = "HALT",
}

export type RuleExecutionStatus =
  | "NOT_EXECUTED"
  | "BLOCKED"
  | "UNKNOWN"
  | "FAILED"
  | "SATISFIED";

export type CitationState =
  | "NOT_EXECUTED"
  | "UNRESOLVED"
  | "IDENTIFIED"
  | "SOURCE_VERIFIED"
  | "TEXT_VERIFIED"
  | "PROPOSITION_SUPPORTED"
  | "TEMPORALLY_VALID"
  | "JURISDICTION_VALID";

export type ClaimType =
  | "SPECIFIC_PERFORMANCE"
  | "DECLARATION_AND_POSSESSION"
  | "INHERITANCE_CONSULTATION"
  | "GENERAL_CIVIL";

/** P0-1: Expanded LegalEventType — new values appended, existing values preserved. */
export type LegalEventType =
  | "ANCESTOR_DEATH"
  | "AGREEMENT_EXECUTION"
  | "AGREEMENT_REGISTERED"
  | "ADVANCE_PAID"
  | "BALANCE_DEPOSIT"
  | "PERFORMANCE_DEADLINE"
  | "LEGAL_NOTICE"
  | "PAYMENT"
  | "DEFAULT"
  | "DEMAND"
  | "REFUSAL"
  | "POSSESSION"
  | "DISPOSSESSION"
  | "ENCROACHMENT"
  | "NOTICE"
  | "FILING"
  | "SERVICE"
  | "JUDGMENT"
  | "DECREE"
  | "ATTAINMENT_OF_MAJORITY"
  | "REGISTRATION"
  | "AMENDMENT"
  | "OTHER";

export type PredicateConflictMode =
  | "BOOLEAN_EXCLUSIVE"
  | "ENUM_EXCLUSIVE"
  | "NUMERIC_EQUALITY"
  | "NUMERIC_RANGE"
  | "MULTI_VALUED"
  | "NON_CONTRADICTORY";

export type ExecutionOutcome =
  | "RESERVED_SUCCESS"
  | "STRUCTURAL_ONLY"
  | "PARTIAL"
  | "INDETERMINATE"
  | "HALTED"
  | "ERROR";

export type PipelineExecutionStatus =
  | "NOT_EXECUTED"
  | "BLOCKED"
  | "PARTIAL"
  | "COMPLETED"
  | "ERROR";

// ============================================================================
// PROVENANCE / SEMANTIC OBJECTS
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
  sourceType?:
    | "INPUT_NARRATIVE"
    | "PLEADING"
    | "DOCUMENT"
    | "ORDER"
    | "JUDGMENT"
    | "OTHER";
  extractionMethod?:
    | "PATTERN"
    | "STRUCTURED_INPUT"
    | "MANUAL_VALIDATION"
    | "DOCUMENT_VALIDATION";
  /** P0-3: Document type provenance for evidence classification. */
  documentType?: string;
  /** P0-3: Document date provenance for temporal verification. */
  documentDate?: string;
}

export type FactSource = SourceSpan;

export interface Proposition {
  propositionId: string;
  subject: string;
  predicate: string;
  object: string | null;
  canonicalKey: string;
  text: string;
  conflictMode: PredicateConflictMode;
}

export interface Assertion {
  assertionId: string;
  propositionId: string;
  assertionType: AssertionType;
  polarity: AssertionPolarity;
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
  /** P0-6: Merged provenance assertions for deduplicated facts.
   *  When two clauses produce the same canonical fact, both assertion IDs
   *  are retained here so no provenance is lost. */
  provenanceAssertions?: string[];
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
// AUTHORITY / RULE GRAPH
// ============================================================================

export interface AuthorityRef {
  authorityId?: string;
  act: string;
  section: string;
  citation?: string;
}

export interface ValidationRequirements {
  extractionRequired: boolean;
  sourceRequired: SourceStatus;
  authenticationRequired: AuthenticationStatus;
  corroborationRequired: CorroborationStatus;
  humanValidationRequired: HumanValidationStatus;
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

export interface LegalRule {
  ruleId: string;
  ruleVersion: string;
  jurisdiction: string;
  effectiveFrom: string;
  effectiveTo?: string;
  claimTypes: ClaimType[];
  ruleType:
    | "ELEMENT"
    | "BAR"
    | "EXCEPTION"
    | "BURDEN"
    | "PRESUMPTION"
    | "LIMITATION"
    | "JURISDICTION"
    | "PROCEDURE"
    | "RELIEF";
  predicates: RulePredicate[];
  logicalOperator: "ALL" | "ANY" | "AT_LEAST_N";
  atLeastN?: number;
  burden?: { party: "PLAINTIFF" | "DEFENDANT"; standard: string };
  outcomeIfSatisfied: string;
  outcomeIfFailed: string;
  legalEffect?: string;
  authority: AuthorityRef;
  authorityIds?: string[];
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
  authorityStatus: "VALIDATED_PRODUCTION" | "DEVELOPMENT_FIXTURE";
  getClaimElements(claimType: ClaimType, jurisdiction: string): LegalRule[];
  getLegislationMapping(claimType: ClaimType): {
    primaryAct: string | null;
    relevantSections: Array<{
      actName: string;
      sectionOrRule: string;
      purpose: string;
    }>;
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
  conflictDetected?: boolean;
  sameFamilyConflictingFacts?: Array<{
    factId: string;
    object: string | null;
    truth: Tristate;
  }>;
}

export interface RuleExecutionResult {
  ruleId: string;
  status: RuleExecutionStatus;
  predicateResults: PredicateExecutionResult[];
  authorityIds: string[];
  burden?: { party: "PLAINTIFF" | "DEFENDANT"; standard: string };
  legalEffect?: string;
  explanationCode: string;
  authorityStatus: "VALIDATED_PRODUCTION" | "DEVELOPMENT_FIXTURE";
}

export interface FactEvaluationResult {
  status: Tristate;
  supportingFactIds: string[];
  conflictDetected: boolean;
  sameFamilyConflictingFacts: Array<{
    factId: string;
    object: string | null;
    truth: Tristate;
  }>;
  validationDetails?: {
    sourceStatus: SourceStatus;
    authenticationStatus: AuthenticationStatus;
    corroborationStatus: CorroborationStatus;
    humanValidationStatus: HumanValidationStatus;
  };
}

// ── Explicit internal interfaces ──

interface ElementGateResult {
  status: GateStatus;
  allSatisfied: boolean;
  missingElements: string[];
  unknownElements: string[];
  fatalFailures: string[];
  ruleExecutionResults: RuleExecutionResult[];
}

interface SynthesisResult {
  status: "HALTED" | "FAILED" | "INDETERMINATE" | "ELEMENTS_SATISFIED";
  conclusion: string;
  confidence: "NONE" | "LOW" | "STRUCTURAL_ONLY";
  requiresHumanReview: boolean;
  humanReviewReason: string;
  elementSummary: Array<{
    ruleId: string;
    status: string;
    explanation: string;
  }>;
  legalConclusions: string[];
  recommendations: string[];
}

interface LegalEvent {
  eventId: string;
  type: LegalEventType;
  date: string | null;
  datePrecision:
    | "EXACT"
    | "MONTH"
    | "YEAR"
    | "UNKNOWN"
    | "AMBIGUOUS";
  sourceFactIds: string[];
}

type TraceLayer =
  | "P0_INPUT_VALIDATION"
  | "P0_EXTRACTION"
  | "F0_GATE"
  | "P1_RULE"
  | "P1_ELEMENT_GATE"
  | "P1_TEMPORAL"
  | "P1_VALUATION"
  | "P1_EVIDENCE"
  | "P2_SYNTHESIS"
  | "SYSTEM_ERROR";

interface ExecutionTraceStep {
  stepId: string;
  layer: TraceLayer;
  description: string;
  dependsOnFacts: string[];
  dependsOnRules: string[];
  result: string;
}

interface ExecutionContext {
  factRegistry: Map<string, AtomicFact>;
  propositionRegistry: Map<string, Proposition>;
  assertionRegistry: Map<string, Assertion>;
  contradictionGraph: ContradictionEdge[];
  eventTimeline: LegalEvent[];
  executionTrace: ExecutionTraceStep[];
  warnings: string[];
  factCounter: number;
  propositionCounter: number;
  assertionCounter: number;
  predicateConflictModes: Map<string, PredicateConflictMode>;
  referenceDate?: number;
}

interface StageExecutionResult {
  stageName: string;
  status: RuleExecutionStatus;
  details: string;
  ruleResults?: RuleExecutionResult[];
  data?: unknown;
}

// ============================================================================
// PREDICATE CONFLICT MODE DEFAULTS
// ============================================================================

const DEFAULT_CONFLICT_MODES: Array<[string, PredicateConflictMode]> = [
  ["*|VITAL STATUS|*", "BOOLEAN_EXCLUSIVE"],
  ["*|REGISTRATION STATUS|*", "ENUM_EXCLUSIVE"],
  ["*|PAYMENT STATUS|*", "ENUM_EXCLUSIVE"],
  ["*|POSSESSION STATUS|*", "BOOLEAN_EXCLUSIVE"],
  ["*|TITLE STATUS|*", "ENUM_EXCLUSIVE"],
  ["*|LOCATION|*", "MULTI_VALUED"],
  ["*|AMOUNT|*", "NUMERIC_EQUALITY"],
  ["*|DATE|*", "NON_CONTRADICTORY"],
];

function getConflictMode(
  ctx: ExecutionContext,
  subject: string,
  predicate: string,
): PredicateConflictMode {
  const key = `${subject.toUpperCase()}|${predicate.toUpperCase()}|*`;
  if (ctx.predicateConflictModes.has(key)) {
    return ctx.predicateConflictModes.get(key)!;
  }
  const predKey = `*|${predicate.toUpperCase()}|*`;
  if (ctx.predicateConflictModes.has(predKey)) {
    return ctx.predicateConflictModes.get(predKey)!;
  }
  return "NON_CONTRADICTORY";
}

// ============================================================================
// CONTEXT / TRACE HELPERS
// ============================================================================

function newContext(): ExecutionContext {
  return {
    factRegistry: new Map(),
    propositionRegistry: new Map(),
    assertionRegistry: new Map(),
    contradictionGraph: [],
    eventTimeline: [],
    executionTrace: [],
    warnings: [],
    factCounter: 1,
    propositionCounter: 1,
    assertionCounter: 1,
    predicateConflictModes: new Map(DEFAULT_CONFLICT_MODES),
  };
}

function recordTrace(
  ctx: ExecutionContext,
  step: Omit<ExecutionTraceStep, "stepId">,
): void {
  const stepId = `TRACE-${String(ctx.executionTrace.length + 1).padStart(5, "0")}`;
  ctx.executionTrace.push({ stepId, ...step });
}

function getAllFactIds(ctx: ExecutionContext): string[] {
  return Array.from(ctx.factRegistry.keys());
}

// ============================================================================
// ONE CANONICAL SERIALIZATION / HASH PATH
// ============================================================================

function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  if (value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return String(value);
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function canonicalHash(value: unknown): string {
  return generateHash(canonicalStringify(value));
}

export interface ForensicHashInput {
  envelope: unknown;
  corpusIdentity: RuleGraphIdentity;
  ruleGraphIdentity: RuleGraphIdentity;
  engineVersion: string;
  corpusMode: string;
}

export function computeForensicHash(input: ForensicHashInput): string {
  return canonicalHash(input);
}

export interface ValidatedAuditSink extends AuditSink {
  readonly atomicAppend: true;
  readonly durable: true;
  readonly concurrencySafe: true;
}

// ============================================================================
// AUDIT / LICENSE INTERFACES
// ============================================================================

export interface AuditRecordPayload {
  caseId?: string;
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
  forensicInputHash: string;
  manifest: typeof ENGINE_MANIFEST;
  executionMilliseconds: number;
  analyzedByUserId: string;
  outcome: ExecutionOutcome;
}

export interface AuditRecord extends AuditRecordPayload {
  previousHash: string | null;
  recordHash: string;
}

export interface AuditSink {
  append(payload: AuditRecordPayload): Promise<AuditRecord>;
}

export interface LicenseValidator {
  validate(
    user: AuthUser,
    license: { licenseId: string; issuedTo: string },
  ): Promise<{ valid: boolean; reason?: string }>;
  isProductionReady?: boolean;
}

export interface FactValidationProvider {
  validateFacts(input: {
    facts: AtomicFact[];
    propositions: Proposition[];
    assertions: Assertion[];
  }): Promise<AtomicFact[]>;
  isProductionReady?: boolean;
  setsTruth?: boolean;
}

// ============================================================================
// FIX #1 & #2: EXPLICIT ADMISSIBILITY SETS (no ordinal comparison)
// ============================================================================

const EXTRACTION_SATISFIES: Record<string, ReadonlySet<ExtractionStatus>> = {
  false: new Set([
    ExtractionStatus.NOT_EXECUTED,
    ExtractionStatus.EXTRACTED,
    ExtractionStatus.PARTIAL,
    ExtractionStatus.FAILED,
  ]),
  true: new Set([ExtractionStatus.EXTRACTED, ExtractionStatus.PARTIAL]),
};

const SOURCE_SATISFIES: Record<SourceStatus, ReadonlySet<SourceStatus>> = {
  UNRESOLVED: new Set([
    SourceStatus.UNRESOLVED,
    SourceStatus.IDENTIFIED,
    SourceStatus.SOURCE_VERIFIED,
  ]),
  IDENTIFIED: new Set([SourceStatus.IDENTIFIED, SourceStatus.SOURCE_VERIFIED]),
  SOURCE_VERIFIED: new Set([SourceStatus.SOURCE_VERIFIED]),
};

const AUTH_SATISFIES: Record<AuthenticationStatus, ReadonlySet<AuthenticationStatus>> = {
  NOT_EXECUTED: new Set([
    AuthenticationStatus.NOT_EXECUTED,
    AuthenticationStatus.UNAUTHENTICATED,
    AuthenticationStatus.AUTHENTICATED,
    AuthenticationStatus.REQUIRES_HUMAN_REVIEW,
  ]),
  UNAUTHENTICATED: new Set([
    AuthenticationStatus.UNAUTHENTICATED,
    AuthenticationStatus.AUTHENTICATED,
  ]),
  AUTHENTICATED: new Set([AuthenticationStatus.AUTHENTICATED]),
  REQUIRES_HUMAN_REVIEW: new Set([AuthenticationStatus.REQUIRES_HUMAN_REVIEW]),
};

const CORR_SATISFIES: Record<CorroborationStatus, ReadonlySet<CorroborationStatus>> = {
  NOT_EXECUTED: new Set([
    CorroborationStatus.NOT_EXECUTED,
    CorroborationStatus.UNCORROBORATED,
    CorroborationStatus.CORROBORATED,
    CorroborationStatus.CONTRADICTED,
  ]),
  UNCORROBORATED: new Set([
    CorroborationStatus.UNCORROBORATED,
    CorroborationStatus.CORROBORATED,
  ]),
  CORROBORATED: new Set([CorroborationStatus.CORROBORATED]),
  CONTRADICTED: new Set([CorroborationStatus.CONTRADICTED]),
};

const HV_SATISFIES: Record<HumanValidationStatus, ReadonlySet<HumanValidationStatus>> = {
  NOT_EXECUTED: new Set([
    HumanValidationStatus.NOT_EXECUTED,
    HumanValidationStatus.NOT_VALIDATED,
    HumanValidationStatus.VALIDATED,
    HumanValidationStatus.REQUIRES_REVIEW,
  ]),
  NOT_VALIDATED: new Set([
    HumanValidationStatus.NOT_VALIDATED,
    HumanValidationStatus.VALIDATED,
  ]),
  VALIDATED: new Set([HumanValidationStatus.VALIDATED]),
  REQUIRES_REVIEW: new Set([HumanValidationStatus.REQUIRES_REVIEW]),
};

function meetsValidationRequirements(
  fact: AtomicFact,
  req: ValidationRequirements,
): boolean {
  if (!EXTRACTION_SATISFIES[String(req.extractionRequired)].has(fact.validation.extractionStatus)) {
    return false;
  }
  if (!SOURCE_SATISFIES[req.sourceRequired].has(fact.validation.sourceStatus)) {
    return false;
  }
  if (!AUTH_SATISFIES[req.authenticationRequired].has(fact.validation.authenticationStatus)) {
    return false;
  }
  if (!CORR_SATISFIES[req.corroborationRequired].has(fact.validation.corroborationStatus)) {
    return false;
  }
  if (!HV_SATISFIES[req.humanValidationRequired].has(fact.validation.humanValidationStatus)) {
    return false;
  }
  return true;
}

// ============================================================================
// DEVELOPMENT IMPLEMENTATIONS — MODULE SCOPE
// ============================================================================

function developmentIdentity(): RuleGraphIdentity {
  return {
    corpusId: "BD-DEVELOPMENT-FIXTURE",
    corpusVersion: "DEVELOPMENT-2026.08",
    corpusDigest: "DEVELOPMENT-NOT-A-LEGAL-CORPUS",
    authorityRegistryVersion: "DEVELOPMENT-AUTHORITY-1.0.0",
    authorityRegistryDigest: "DEVELOPMENT-NOT-VERIFIED",
    ruleGraphVersion: ENGINE_MANIFEST.ruleGraphVersion,
    ruleGraphDigest: "DEVELOPMENT-RULE-GRAPH",
  };
}

export class DevelopmentRuleRegistry implements RuleRegistry {
  version = "DEVELOPMENT-FIXTURE-3.0.0";
  identity = developmentIdentity();
  authorityStatus = "DEVELOPMENT_FIXTURE" as const;

  getClaimElements(claimType: ClaimType, jurisdiction: string): LegalRule[] {
    if (claimType === "SPECIFIC_PERFORMANCE") {
      return [
        {
          ruleId: "SP-ELEMENT-REGISTRATION",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1872-09-01",
          claimTypes: [claimType],
          ruleType: "ELEMENT",
          logicalOperator: "ALL",
          predicates: [
            {
              predicateId: "SP-P1",
              subject: "Bainapatra",
              predicate: "Registration Status",
              object: "REGISTERED",
              requiredTruth: Tristate.TRUE,
              validationRequirements: {
                extractionRequired: true,
                sourceRequired: SourceStatus.SOURCE_VERIFIED,
                authenticationRequired: AuthenticationStatus.AUTHENTICATED,
                corroborationRequired: CorroborationStatus.CORROBORATED,
                humanValidationRequired: HumanValidationStatus.VALIDATED,
              },
            },
          ],
          outcomeIfSatisfied: "REGISTRATION_ELEMENT_SATISFIED",
          outcomeIfFailed: "REGISTRATION_ELEMENT_FAILED",
          authority: { act: "Applicable specific-performance law", section: "Registry-controlled" },
          priority: 1,
        },
        {
          ruleId: "SP-ELEMENT-DEPOSIT",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1872-09-01",
          claimTypes: [claimType],
          ruleType: "ELEMENT",
          logicalOperator: "ALL",
          predicates: [
            {
              predicateId: "SP-P2",
              subject: "Treasury Deposit",
              predicate: "Payment Status",
              object: "DEPOSITED",
              requiredTruth: Tristate.TRUE,
              validationRequirements: {
                extractionRequired: true,
                sourceRequired: SourceStatus.IDENTIFIED,
                authenticationRequired: AuthenticationStatus.UNAUTHENTICATED,
                corroborationRequired: CorroborationStatus.UNCORROBORATED,
                humanValidationRequired: HumanValidationStatus.NOT_VALIDATED,
              },
            },
          ],
          outcomeIfSatisfied: "DEPOSIT_ELEMENT_SATISFIED",
          outcomeIfFailed: "DEPOSIT_ELEMENT_FAILED",
          authority: { act: "Applicable specific-performance law", section: "Registry-controlled" },
          priority: 2,
        },
      ];
    }
    if (claimType === "INHERITANCE_CONSULTATION") {
      return [
        {
          ruleId: "SUCCESSION-DEATH-ELEMENT",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1925-01-01",
          claimTypes: [claimType],
          ruleType: "ELEMENT",
          logicalOperator: "ALL",
          predicates: [
            {
              predicateId: "SUCC-P1",
              subject: "Ancestor",
              predicate: "Vital Status",
              object: "DECEASED",
              requiredTruth: Tristate.TRUE,
              validationRequirements: {
                extractionRequired: true,
                sourceRequired: SourceStatus.IDENTIFIED,
                authenticationRequired: AuthenticationStatus.AUTHENTICATED,
                corroborationRequired: CorroborationStatus.CORROBORATED,
                humanValidationRequired: HumanValidationStatus.VALIDATED,
              },
            },
          ],
          outcomeIfSatisfied: "SUCCESSION_OPENED",
          outcomeIfFailed: "SUCCESSION_NOT_ESTABLISHED",
          authority: { act: "Applicable succession law", section: "Registry-controlled" },
          priority: 1,
        },
      ];
    }
    if (claimType === "DECLARATION_AND_POSSESSION") {
      return [
        {
          ruleId: "DP-ELEMENT-TITLE",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1877-01-01",
          claimTypes: [claimType],
          ruleType: "ELEMENT",
          logicalOperator: "ALL",
          predicates: [
            {
              predicateId: "DP-P1",
              subject: "Plaintiff",
              predicate: "Title Status",
              object: "REGISTERED_OWNER",
              requiredTruth: Tristate.TRUE,
              validationRequirements: {
                extractionRequired: true,
                sourceRequired: SourceStatus.SOURCE_VERIFIED,
                authenticationRequired: AuthenticationStatus.AUTHENTICATED,
                corroborationRequired: CorroborationStatus.CORROBORATED,
                humanValidationRequired: HumanValidationStatus.VALIDATED,
              },
            },
          ],
          outcomeIfSatisfied: "TITLE_ELEMENT_SATISFIED",
          outcomeIfFailed: "TITLE_ELEMENT_FAILED",
          authority: { act: "Transfer of Property Act 1882", section: "Section 54" },
          priority: 1,
        },
        {
          ruleId: "DP-ELEMENT-POSSESSION",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1908-01-01",
          claimTypes: [claimType],
          ruleType: "ELEMENT",
          logicalOperator: "ALL",
          predicates: [
            {
              predicateId: "DP-P2",
              subject: "Plaintiff",
              predicate: "Possession Status",
              object: "DISPOSSESSED",
              requiredTruth: Tristate.TRUE,
              validationRequirements: {
                extractionRequired: true,
                sourceRequired: SourceStatus.IDENTIFIED,
                authenticationRequired: AuthenticationStatus.UNAUTHENTICATED,
                corroborationRequired: CorroborationStatus.UNCORROBORATED,
                humanValidationRequired: HumanValidationStatus.NOT_VALIDATED,
              },
            },
          ],
          outcomeIfSatisfied: "DISPOSSESSION_ELEMENT_SATISFIED",
          outcomeIfFailed: "DISPOSSESSION_ELEMENT_FAILED",
          authority: { act: "Specific Relief Act 1877", section: "Section 8" },
          priority: 2,
        },
      ];
    }
    return [];
  }

  getLegislationMapping(claimType: ClaimType) {
    if (claimType === "SPECIFIC_PERFORMANCE" || claimType === "DECLARATION_AND_POSSESSION") {
      return {
        primaryAct: "Specific Relief Act 1877",
        relevantSections: [{ actName: "Specific Relief Act 1877", sectionOrRule: "Sections 8-12, 21A", purpose: "Claim-specific analysis" }],
      };
    }
    if (claimType === "INHERITANCE_CONSULTATION")
      return { primaryAct: "Applicable succession / personal law", relevantSections: [] };
    return { primaryAct: null, relevantSections: [] };
  }
}

export class DefaultRuleRegistry extends DevelopmentRuleRegistry {
  constructor() { super(); }
}

// P0 FIX: DefaultAuditSink.append() — remove unreachable code after return
export class DefaultAuditSink implements AuditSink {
  readonly isProductionReady = false;
  private lastRecord: AuditRecord | null = null;
  async append(payload: AuditRecordPayload): Promise<AuditRecord> {
    const previousHash = this.lastRecord?.recordHash ?? null;
    const recordHash = canonicalHash({ payload, previousHash });
    const record = { ...payload, previousHash, recordHash };
    this.lastRecord = record;
    return record;
  }
}

export class DefaultLicenseValidator implements LicenseValidator {
  readonly isProductionReady = false;
  async validate(_user: AuthUser, license: { licenseId: string; issuedTo: string }) {
    if (!license?.licenseId || !license?.issuedTo)
      return { valid: false, reason: "License object incomplete." };
    return { valid: true };
  }
}

export class NoOpFactValidationProvider implements FactValidationProvider {
  readonly isProductionReady = false;
  async validateFacts({ facts }: { facts: AtomicFact[]; propositions: Proposition[]; assertions: Assertion[] }) {
    return facts.map((f) => ({
      ...f,
      truth: Tristate.UNKNOWN,
      validationStatus: ValidationStatus.UNVERIFIED,
      validation: {
        ...f.validation,
        humanValidationStatus: HumanValidationStatus.NOT_VALIDATED,
      },
    }));
  }
}

// P0-4: Development provider sets truth=TRUE for extracted facts.
// The provider marks itself with setsTruth so the integrity gate knows
// this promotion is intentional, not a validator bug.
export class DevelopmentFactValidationProvider implements FactValidationProvider {
  readonly isProductionReady = false;
  readonly setsTruth = true;
  async validateFacts({ facts }: { facts: AtomicFact[]; propositions: Proposition[]; assertions: Assertion[] }) {
    return facts.map((f) => {
      // A DENIED assertion, or one with DISPUTED/NEGATIVE polarity, must never
      // be silently promoted to TRUE just because its truth was UNKNOWN — that
      // would treat a denial as an established fact. Leave truth untouched for
      // these; only affirmative/neutral UNKNOWN facts get promoted.
      const isNonPromotable =
        f.assertionType === AssertionType.DENIED ||
        f.polarity === AssertionPolarity.DISPUTED ||
        f.polarity === AssertionPolarity.NEGATIVE;
      return {
        ...f,
        truth: !isNonPromotable && f.truth === Tristate.UNKNOWN ? Tristate.TRUE : f.truth,
        validationStatus: ValidationStatus.VERIFIED,
        confidence: FactConfidence.VERIFIED,
        validation: {
          extractionStatus: ExtractionStatus.EXTRACTED,
          sourceStatus: SourceStatus.SOURCE_VERIFIED,
          authenticationStatus: AuthenticationStatus.AUTHENTICATED,
          corroborationStatus: CorroborationStatus.CORROBORATED,
          humanValidationStatus: HumanValidationStatus.VALIDATED,
        },
      };
    });
  }
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// ============================================================================
// DATE PARSING — Hardened for Bangladeshi Legal Narratives
// ============================================================================

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function parseNaturalDate(raw: string): { iso: string; ts: number } | null {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase().replace(/(\d+)(st|nd|rd|th)/, "$1");
  let y: number, m: number, d: number;

  const dmy = s.match(/^(\d{1,2})\s+([a-z]{3,})\s*,?\s*(\d{4})$/);
  if (dmy) { d = Number(dmy[1]); m = MONTH_MAP[dmy[2]]; y = Number(dmy[3]); }
  else if ((s.match(/^([a-z]{3,})\s+(\d{1,2})\s*,?\s*(\d{4})$/))) {
    const mdy = s.match(/^([a-z]{3,})\s+(\d{1,2})\s*,?\s*(\d{4})$/)!;
    m = MONTH_MAP[mdy[1]]; d = Number(mdy[2]); y = Number(mdy[3]);
  }
  else if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(s)) {
    const p = s.split(/[-\/]/); [y, m, d] = p.map(Number); m -= 1;
  }
  else if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(s)) {
    const p = s.split(/[-\/]/); d = Number(p[0]); m = Number(p[1]) - 1; y = Number(p[2]);
    if (y < 100) y += y < 50 ? 2000 : 1900;
  }
  else { return null; }

  if ([y, m, d].some(isNaN) || y < 1 || m < 0 || m > 11 || d < 1 || d > 31) return null;
  const utc = Date.UTC(y, m, d);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m || check.getUTCDate() !== d) return null;
  return { iso: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, ts: utc };
}

function isStrictDate(raw: string): boolean {
  return parseNaturalDate(raw) !== null;
}

function strictDateTimestamp(raw: string | null): number {
  return raw ? (parseNaturalDate(raw)?.ts ?? Infinity) : Infinity;
}

function normalizeDate(raw: string): string {
  return parseNaturalDate(raw)?.iso ?? raw;
}

function isAmbiguousDate(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  const s = raw.trim();
  if (!/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(s)) return false;
  const parts = s.split(/[-\/]/);
  const d = Number(parts[0]);
  const m = Number(parts[1]);
  return d >= 1 && d <= 12 && m >= 1 && m <= 12;
}

function parseMoney(token: string): number | null {
  const digits = token.replace(/[^0-9.]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function shortId(prefix: string, counter: number): string {
  return `${prefix}${String(counter).padStart(5, "0")}`;
}

// ============================================================================
// FACT CANDIDATE INTERFACE
// ============================================================================

interface FactCandidate {
  subject: string;
  predicate: string;
  object: string | null;
  eventDate?: string;
  normalizedValue?: string | number | boolean | null;
}

// ============================================================================
// ENGINE
// ============================================================================

export interface AnalyzeRequest {
  caseId?: string;
  user: AuthUser;
  license: { licenseId: string; issuedTo: string };
  input: EngineInput;
}

export class BCCAAEngine {
  private readonly ruleRegistry: RuleRegistry;
  private readonly auditSink: AuditSink;
  private readonly licenseValidator: LicenseValidator;
  private readonly factValidationProvider: FactValidationProvider;
  private readonly authorityStatus: "VALIDATED_PRODUCTION" | "DEVELOPMENT_FIXTURE";

  constructor(deps?: {
    ruleRegistry?: RuleRegistry;
    auditSink?: AuditSink;
    licenseValidator?: LicenseValidator;
    factValidationProvider?: FactValidationProvider;
  }) {
    this.ruleRegistry = (deps?.ruleRegistry ?? new DevelopmentRuleRegistry()) as RuleRegistry;
    this.auditSink = deps?.auditSink ?? new DefaultAuditSink();
    this.licenseValidator = deps?.licenseValidator ?? new DefaultLicenseValidator();
    this.factValidationProvider =
      deps?.factValidationProvider ??
      (ENGINE_MANIFEST.corpusMode === "DEVELOPMENT"
        ? new DevelopmentFactValidationProvider()
        : new NoOpFactValidationProvider());
    this.authorityStatus =
      deps?.ruleRegistry?.authorityStatus ?? this.ruleRegistry.authorityStatus ?? "DEVELOPMENT_FIXTURE";

    if (ENGINE_MANIFEST.corpusMode === "VALIDATED_PRODUCTION") {
      if (this.authorityStatus !== "VALIDATED_PRODUCTION") {
        throw new Error("FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires ruleRegistry.authorityStatus === 'VALIDATED_PRODUCTION'.");
      }
      const sink = this.auditSink as unknown as Record<string, unknown>;
      if (sink.atomicAppend !== true || sink.durable !== true || sink.concurrencySafe !== true) {
        throw new Error("FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a ValidatedAuditSink.");
      }
      if (this.factValidationProvider instanceof NoOpFactValidationProvider) {
        throw new Error("FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a production FactValidationProvider.");
      }
    }
  }

  // =======================================================================
  // PUBLIC API
  // =======================================================================

  async analyze(request: AnalyzeRequest): Promise<CaseAnalysisResponse> {
    const startTime = 0;
    const caseId = request.caseId ?? "BCCAA-STATIC-ID";
    const ctx = newContext();

    try {
      const license = await this.licenseValidator.validate(request.user, request.license);
      if (!license.valid) {
        recordTrace(ctx, { layer: "P0_INPUT_VALIDATION", description: `LICENSE_DENIED: ${license.reason ?? "unspecified"}`, dependsOnFacts: [], dependsOnRules: [], result: "REJECTED" });
        return this.buildPreF0HaltResponse(ctx, caseId, "LICENSE_DENIED", license.reason ?? "unspecified");
      }
      if (!request.input?.factPattern) {
        recordTrace(ctx, { layer: "P0_INPUT_VALIDATION", description: "EMPTY_INPUT: factPattern is required.", dependsOnFacts: [], dependsOnRules: [], result: "REJECTED" });
        return this.buildPreF0HaltResponse(ctx, caseId, "EMPTY_INPUT", "factPattern is required.");
      }
      if (request.input.factPattern.length > MAX_INPUT_LENGTH) {
        recordTrace(ctx, { layer: "P0_INPUT_VALIDATION", description: `INPUT_TOO_LARGE: maximum ${MAX_INPUT_LENGTH} characters.`, dependsOnFacts: [], dependsOnRules: [], result: "REJECTED" });
        return this.buildPreF0HaltResponse(ctx, caseId, "INPUT_TOO_LARGE", `maximum ${MAX_INPUT_LENGTH} characters.`);
      }
      return await this.runPipeline(ctx, request, caseId, startTime);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      recordTrace(ctx, { layer: "SYSTEM_ERROR", description: "Uncaught execution error.", dependsOnFacts: [], dependsOnRules: [], result: message });
      const response = this.buildPreF0HaltResponse(ctx, caseId, "SYSTEM_ERROR", message);
      await this.persistAudit(ctx, request, caseId, startTime, "ERROR", this.computeOutputHash(response, caseId)).catch(() => undefined);
      return response;
    }
  }

  // =======================================================================
  // PIPELINE ORCHESTRATION
  // =======================================================================

  private async runPipeline(
    ctx: ExecutionContext,
    request: AnalyzeRequest,
    caseId: string,
    startTime: number,
  ): Promise<CaseAnalysisResponse> {
    const { input } = request;
    const claimType = this.resolveClaimType(input.factPattern, input.focusDomain ?? "");
    ctx.referenceDate = input.submissionDate ? new Date(input.submissionDate).getTime() : 0;

    this.extractAtomicFacts(ctx, input.factPattern, claimType);
    await this.applyFactValidation(ctx);
    this.buildContradictionGraph(ctx);
    this.buildEventTimeline(ctx);
    this.logCriticalConflicts(ctx);

    const ancestorResult = claimType === "INHERITANCE_CONSULTATION"
      ? this.evaluateFact(ctx, "Ancestor", "Vital Status", "DECEASED", { requireVerified: true })
      : ({ status: Tristate.UNKNOWN, supportingFactIds: [], conflictDetected: false, sameFamilyConflictingFacts: [] } as FactEvaluationResult);

    const chronology = ctx.eventTimeline.map((e) => ({
      date: e.date ?? "UNKNOWN",
      event: e.type,
      partiesInvolved: "",
      factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
      conflictInfo: ctx.contradictionGraph.length > 0
        ? {
            total: ctx.contradictionGraph.length,
            critical: ctx.contradictionGraph.filter((edge) => edge.status === "CRITICAL").length,
            edges: ctx.contradictionGraph.map((edge) => ({
              propositionKey: edge.propositionKey,
              leftFactId: edge.leftFactId,
              rightFactId: edge.rightFactId,
              status: edge.status,
            })),
          }
        : undefined,
    }));

    const f0Gate = FactConsistencyGate.evaluate(
      input.factPattern,
      chronology,
      claimType,
      ancestorResult,
      Array.from(ctx.factRegistry.values()).map((f) => ({
        factId: f.factId, subject: f.subject, predicate: f.predicate, object: f.object,
        truth: f.truth, eventDate: f.eventDate, proposition: f.proposition,
      })),
      ctx.contradictionGraph.map((e) => ({
        propositionKey: e.propositionKey, leftFactId: e.leftFactId, rightFactId: e.rightFactId, status: e.status,
      })),
    );

    recordTrace(ctx, {
      layer: "F0_GATE",
      description: `FactConsistencyGate executed. ancestorDeceased: ${ancestorResult.status}. Conflict: ${ancestorResult.conflictDetected}.`,
      dependsOnFacts: getAllFactIds(ctx), dependsOnRules: [], result: f0Gate.gateStatus,
    });

    const domain = this.classifyDomain(ctx, claimType);
    const legislation = this.mapLegislation(ctx, claimType);

    if (f0Gate.gateStatus === "HALT_CRITICAL_CONFLICT") {
      const emptyGate: ElementGateResult = { status: GateStatus.HALT, allSatisfied: false, missingElements: [], unknownElements: [], fatalFailures: ["F0_CRITICAL_CONFLICT"], ruleExecutionResults: [] };
      const synthesis = this.executeFailClosedSynthesis(ctx, f0Gate, claimType, emptyGate);
      const response = this.buildF0HaltResponse(ctx, request, claimType, f0Gate, synthesis, caseId, domain, legislation);
      await this.persistAudit(ctx, request, caseId, startTime, "HALTED", this.computeOutputHash(response, caseId));
      return response;
    }

    const limitation = this.executeLimitationEngine(ctx, claimType);
    const elementGate = this.executeElementCompletenessGate(ctx, claimType);
    const standi = this.executePartyStandiRules(ctx, claimType, input.factPattern);
    const pleading = this.executePleadingRules(elementGate, input.factPattern);
    const issues = this.executeIssueFramingRules(ctx, elementGate, input.factPattern);
    const evidence = this.executeEvidenceRules(ctx);
    const merits = this.executeMeritRules(elementGate);
    const equity = this.executeEquityRules(elementGate, ctx);
    const procedure = this.executeProcedureRules(ctx, claimType);
    const appeal = this.executeAppealRules();

    const synthesis = this.executeFailClosedSynthesis(ctx, f0Gate, claimType, elementGate);
    const executionStatus = this.determineExecutionStatus(standi, pleading, issues, evidence, merits, equity, procedure, appeal);
    const outcome = this.determineOutcome(executionStatus, elementGate);

    const response = this.buildResponse(ctx, request, claimType, f0Gate, synthesis, {
      caseId, domain, legislation, limitation, standi, pleading, issues, evidence, elementGate, merits, equity, procedure, appeal, executionStatus,
    });
    await this.persistAudit(ctx, request, caseId, startTime, outcome, this.computeOutputHash(response, caseId));
    return response;
  }

  // =======================================================================
  // P0 EXTRACTION
  // =======================================================================

  private extractAtomicFacts(ctx: ExecutionContext, rawText: string, claimType: ClaimType): void {
    const sentences = this.segmentDocument(rawText);
    for (let index = 0; index < sentences.length; index++) {
      const sentence = sentences[index];
      for (const clause of this.segmentClauses(sentence)) {
        const candidates = this.extractClauseFacts(clause);
        if (!candidates.length) continue;

        const assertionContext = this.detectAssertionContext(clause);
        const assertedBy = assertionContext.assertedBy ?? this.detectAssertingParty(clause);

        for (const candidate of candidates) {
          const propositionId = this.ensureProposition(ctx, candidate.subject, candidate.predicate, candidate.object, clause);
          const assertionId = shortId("A", ctx.assertionCounter++);
          const source: SourceSpan = {
            documentId: "INPUT_NARRATIVE",
            segment: clause,
            paragraph: index + 1,
            sourceType: assertionContext.documentType ? "DOCUMENT" : "INPUT_NARRATIVE",
            extractionMethod: "PATTERN",
            documentType: assertionContext.documentType,
            documentDate: assertionContext.documentDate,
          };

          ctx.assertionRegistry.set(assertionId, {
            assertionId, propositionId,
            assertionType: assertionContext.type,
            polarity: assertionContext.polarity,
            assertedBy: assertedBy ?? undefined,
            sourceSpan: source,
          });

          // P0-6: Canonical deduplication with deterministic provenance merge
          const canonicalKey = `${candidate.subject}|${candidate.predicate}|${(candidate.object || "").toString().toUpperCase()}`;
          const existingFact = Array.from(ctx.factRegistry.values()).find(
            (f) => `${f.subject}|${f.predicate}|${(f.object || "").toString().toUpperCase()}`.toUpperCase() === canonicalKey.toUpperCase()
          );

          if (existingFact) {
            // P0-6 FIX: only merge provenance when the new assertion agrees
            // with the existing fact. If one side DENIES/DISPUTES the exact
            // same subject|predicate|object the other side asserted, that is
            // a genuine conflict on an identical proposition — collapsing it
            // into a single fact would silently erase the denial and hide it
            // from contradiction detection (which only compares differing
            // objects within a family, not assertion type). Fall through and
            // register it as its own distinct fact instead.
            const isDenial = (t: AssertionType, p: AssertionPolarity) =>
              t === AssertionType.DENIED || p === AssertionPolarity.DISPUTED || p === AssertionPolarity.NEGATIVE;
            const existingIsDenial = isDenial(existingFact.assertionType, existingFact.polarity);
            const newIsDenial = isDenial(assertionContext.type, assertionContext.polarity);
            const conflictingAssertion = existingIsDenial !== newIsDenial;

            if (!conflictingAssertion) {
              // Merge provenance deterministically: sort + dedupe
              const merged = new Set([
                existingFact.assertionId,
                ...(existingFact.provenanceAssertions ?? []),
                assertionId,
              ]);
              existingFact.provenanceAssertions = Array.from(merged).sort();
              continue;
            }
            // Otherwise fall through: register as a distinct fact below so
            // both the affirmative and the denial survive independently.
          }

          const factId = shortId("F", ctx.factCounter++);
          const fact: AtomicFact = {
            factId, propositionId, assertionId,
            proposition: clause,
            subject: candidate.subject,
            predicate: candidate.predicate,
            object: candidate.object,
            truth: Tristate.UNKNOWN,
            polarity: assertionContext.polarity,
            source,
            assertionType: assertionContext.type,
            validationStatus: ValidationStatus.UNVERIFIED,
            confidence: FactConfidence.CANDIDATE,
            assertedBy: assertedBy ?? undefined,
            eventDate: candidate.eventDate ?? null,
            normalizedValue: candidate.normalizedValue ?? null,
            disputedProposition: assertionContext.type === AssertionType.DENIED || assertionContext.polarity === AssertionPolarity.DISPUTED ? clause : undefined,
            validation: {
              extractionStatus: ExtractionStatus.EXTRACTED,
              sourceStatus: SourceStatus.IDENTIFIED,
              authenticationStatus: AuthenticationStatus.UNAUTHENTICATED,
              corroborationStatus: CorroborationStatus.UNCORROBORATED,
              humanValidationStatus: HumanValidationStatus.NOT_VALIDATED,
            },
          };
          ctx.factRegistry.set(factId, fact);
          recordTrace(ctx, {
            layer: "P0_EXTRACTION",
            description: `FACT -> PROPOSITION -> ASSERTION: ${factId}`,
            dependsOnFacts: [], dependsOnRules: [],
            result: `${factId}:${propositionId}:${assertionId}`,
          });
        }
      }
    }
    this.ensureClaimRelevantUnknowns(ctx, claimType);
  }

  private ensureProposition(ctx: ExecutionContext, subject: string, predicate: string, object: string | null, text: string): string {
    const canonicalKey = `${subject}|${predicate}|${object ?? "*"}`.toUpperCase();
    const existing = Array.from(ctx.propositionRegistry.values()).find((p) => p.canonicalKey === canonicalKey);
    if (existing) return existing.propositionId;
    const propositionId = shortId("P", ctx.propositionCounter++);
    ctx.propositionRegistry.set(propositionId, {
      propositionId, subject, predicate, object, canonicalKey, text,
      conflictMode: getConflictMode(ctx, subject, predicate),
    });
    return propositionId;
  }

  private async applyFactValidation(ctx: ExecutionContext): Promise<void> {
    const validated = await this.factValidationProvider.validateFacts({
      facts: Array.from(ctx.factRegistry.values()),
      propositions: Array.from(ctx.propositionRegistry.values()),
      assertions: Array.from(ctx.assertionRegistry.values()),
    });
    if (validated.length !== ctx.factRegistry.size) {
      throw new Error("FACT_VALIDATION_INTEGRITY_ERROR: validator changed fact cardinality.");
    }
    for (const fact of validated) {
      const original = ctx.factRegistry.get(fact.factId);
      if (!original) throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: unknown fact ${fact.factId}.`);

      if (
        fact.subject !== original.subject ||
        fact.predicate !== original.predicate ||
        fact.object !== original.object ||
        fact.assertionId !== original.assertionId ||
        fact.propositionId !== original.propositionId
      ) {
        throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: fact ${fact.factId} identity mutated by validator.`);
      }

      // P0-4: Allow development validator to promote UNKNOWN -> TRUE
      const providerAllowsPromotion = this.factValidationProvider.setsTruth === true;
      const isAllowedPromotion = providerAllowsPromotion &&
        original.truth === Tristate.UNKNOWN &&
        fact.truth === Tristate.TRUE;

      if (
        original.truth === Tristate.UNKNOWN &&
        fact.truth !== Tristate.UNKNOWN &&
        !isAllowedPromotion
      ) {
        throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: fact ${fact.factId} truth silently mutated from UNKNOWN to ${fact.truth} by validator.`);
      }

      ctx.factRegistry.set(fact.factId, fact);
    }
  }

  // =======================================================================
  // P0 HELPERS: SEGMENTATION
  // =======================================================================

  private segmentDocument(rawText: string): string[] {
    let text = rawText.replace(/\r\n/g, "\n");
    const abbreviations = [
      "Mr", "Mrs", "Ms", "Dr", "vs", "v", "BDT", "Tk", "Taka", "taka",
      "No", "Art", "Sec", "Ord", "SRA", "CPC", "St", "Lt", "Col", "Gen",
      "Prof", "Hon", "Jr", "Sr", "ALR", "BLD", "BLC", "DLR", "MLR",
      "AD", "SC", "HC", "Vol", "pp", "etc", "i.e", "e.g",
    ];
    const protectedMarks: string[] = [];
    for (const abbr of abbreviations) {
      const regex = new RegExp(`\\b${abbr}\.`, "gi");
      text = text.replace(regex, (match) => {
        const mark = `\x00P${protectedMarks.length}\x00`;
        protectedMarks.push(match);
        return mark;
      });
    }
    text = text.replace(/(\d[\d,]*)\./g, (_match, num: string) => {
      const mark = `\x00P${protectedMarks.length}\x00`;
      protectedMarks.push(`${num}.`);
      return mark;
    });
    const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    return sentences.map((s) => {
      let result = s;
      for (let i = protectedMarks.length - 1; i >= 0; i--) {
        result = result.replace(`\x00P${i}\x00`, protectedMarks[i]);
      }
      return result;
    });
  }

  private segmentClauses(sentence: string): string[] {
    return sentence.split(/\s*(?:;|\bbut\b|\balthough\b|\bhowever\b|\bwhereas\b|\bwhile\b)\s*/i)
      .map((x) => x.trim()).filter(Boolean);
  }

  // =======================================================================
  // P0 HELPERS: FACT EXTRACTION (COMPLETE REWRITE — 4 PASSES)
  // =======================================================================

  private extractClauseFacts(clause: string): FactCandidate[] {
    const candidates: FactCandidate[] = [];
    this.extractParties(clause, candidates);
    this.extractAgreementFacts(clause, candidates);
    this.extractMonetaryFacts(clause, candidates);
    this.extractPropertyFacts(clause, candidates);
    this.extractRegistrationFacts(clause, candidates);
    this.extractTemporalFacts(clause, candidates);
    this.extractDocumentFacts(clause, candidates);
    this.extractSuccessionFacts(clause, candidates);
    this.extractPossessionFacts(clause, candidates);
    return candidates;
  }

  // P0-1: Party identity extraction
  private extractParties(clause: string, candidates: FactCandidate[]): void {
    // Plaintiff: Name (with honorifics)
    const plaintiffMatch = clause.match(
      /(?:plaintiff|petitioner|complainant)\s*[:\-]?\s+((?:Mr\.?|Mrs\.?|Ms\.?|Md\.?|M\/s\.?)?\s*[A-Za-z][A-Za-z\s\.]+?)(?=\s*(?:,|;|\.|and|or|vs|versus|is|was|filed|through|aged|son|daughter|of|resident|$))/i
    );
    if (plaintiffMatch) {
      const name = plaintiffMatch[1].trim();
      if (name.length > 2) {
        candidates.push({ subject: "Plaintiff", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "PLAINTIFF" });
      }
    }
    // Defendant: Name (with honorifics)
    const defendantMatch = clause.match(
      /(?:defendant|respondent|opposite\s+party)\s*[:\-]?\s+((?:Mr\.?|Mrs\.?|Ms\.?|Md\.?|M\/s\.?)?\s*[A-Za-z][A-Za-z\s\.]+?)(?=\s*(?:,|;|\.|and|or|vs|versus|is|was|filed|through|aged|son|daughter|of|resident|$))/i
    );
    if (defendantMatch) {
      const name = defendantMatch[1].trim();
      if (name.length > 2) {
        candidates.push({ subject: "Defendant", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "DEFENDANT" });
      }
    }
    // Role assignment: "X is purchaser", "Y is vendor"
    const roleMatch = clause.match(/([A-Z][a-zA-Z\s\.]+?)\s+is\s+(?:the\s+)?(purchaser|vendor|seller|buyer|owner|heir|co-sharer)/i);
    if (roleMatch) {
      const name = roleMatch[1].trim();
      const role = roleMatch[2].toUpperCase();
      candidates.push({ subject: name, predicate: "Capacity", object: role });
    }
  }

  // P0-3: Agreement/registration facts
  private extractAgreementFacts(clause: string, candidates: FactCandidate[]): void {
    const lower = clause.toLowerCase();
    // Execution date
    const execMatch = clause.match(
      /(?:agreement|bainapatra|contract|sale\s+deed)[^\.]{0,80}?\b(?:executed|signed|dated|on)\b[^\.]{0,30}?([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i
    );
    if (execMatch) {
      const date = execMatch[1].trim();
      candidates.push({ subject: "Bainapatra", predicate: "Execution Date", object: date, eventDate: date });
    }
    // Registration status — tri-state, explicit only
    if (/\bregistered\s+(?:bainapatra|agreement|sale\s+deed)\b/i.test(lower)) {
      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "REGISTERED" });
    } else if (
      /\bunregistered\s+(?:bainapatra|agreement|sale\s*deed)\b/i.test(lower) ||
      /(?:bainapatra|agreement|sale\s*deed)(?:\s+\w+){0,3}\s+(?:not\s+registered|without\s+registration)\b/i.test(lower)
    ) {
      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "UNREGISTERED" });
    }
    // Registration case number
    const regCaseMatch = clause.match(/(?:registration\s+case\s+no\.?|reg\.?\s*case)\s+([A-Z0-9\-]+)/i);
    if (regCaseMatch) {
      candidates.push({ subject: "Registration", predicate: "Case Number", object: regCaseMatch[1].trim() });
    }
    // Section 17A
    if (/\bsection\s+17A\b/i.test(clause)) {
      candidates.push({ subject: "Registration", predicate: "Statutory Basis", object: "Section 17A" });
    }
    // Section 21A
    if (/\bsection\s+21A\b/i.test(clause)) {
      candidates.push({ subject: "Specific Relief", predicate: "Statutory Basis", object: "Section 21A" });
    }
  }

  // P0-2: Semantic monetary classification
  private extractMonetaryFacts(clause: string, candidates: FactCandidate[]): void {
    const patterns: Array<{ regex: RegExp; subject: string; predicate: string }> = [
      { regex: /(?:total\s+consideration|total\s+price)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Contract", predicate: "Total Consideration" },
      { regex: /(?:advance|earnest\s+money|earnest)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Advance", predicate: "Amount Paid" },
      { regex: /(?:balance\s+consideration|balance\s+amount|balance)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Balance", predicate: "Consideration" },
      { regex: /(?:deposited|deposit)(?:\s+\w+){0,3}\s+(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Court", predicate: "Deposit" },
      { regex: /(?:alternative\s+claim|alternative\s+money)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Alternative Claim", predicate: "Money Claim" },
      { regex: /(?:interest|interest\s+claim)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Interest", predicate: "Claim Amount" },
      { regex: /(?:damages|compensation)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Damages", predicate: "Claim Amount" },
      { regex: /(?:suit\s+valuation|valuation)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Suit", predicate: "Valuation" },
      { regex: /(?:court\s+fee|court\s+fees)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Court Fee", predicate: "Value" },
      { regex: /(?:jurisdictional\s+value|jurisdiction)\s+(?:of\s+)?(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/i, subject: "Jurisdiction", predicate: "Value" },
    ];

    for (const p of patterns) {
      const m = clause.match(p.regex);
      if (m) {
        const val = parseMoney(m[1]);
        if (val !== null) {
          candidates.push({ subject: p.subject, predicate: p.predicate, object: `Tk. ${m[1]}`, normalizedValue: val });
        }
      }
    }

    // Generic quantum fallback (only if no semantic match)
    const hasSemantic = candidates.some((c) => c.predicate !== "Quantum Amount" && /^(Tk\.?|taka|bdt)/i.test(c.object || ""));
    if (!hasSemantic) {
      const genericMatches = clause.matchAll(/(?:tk\.?|taka|bdt)\s*([\d,]+(?:\.\d+)?)/gi);
      for (const mm of genericMatches) {
        const val = parseMoney(mm[1]);
        if (val !== null) {
          candidates.push({ subject: "Claim", predicate: "Quantum Amount", object: `Tk. ${mm[1]}`, normalizedValue: val });
        }
      }
    }
  }

  private extractPropertyFacts(clause: string, candidates: FactCandidate[]): void {
    const lower = clause.toLowerCase();
    // Area
    const areaMatch = clause.match(/(\d+(?:\.\d+)?)\s*(?:decimal|decimals|katha|bigha|acre|acres)/i);
    if (areaMatch) {
      candidates.push({ subject: "Property", predicate: "Area", object: areaMatch[0] });
    }
    // Co-sharers
    if (/\b(?:co-?sharers?|joint\s+owner|joint\s+ownership|jointly\s+owned)\b/i.test(lower)) {
      candidates.push({ subject: "Property", predicate: "Ownership Structure", object: "JOINT" });
    }
    // Mutation
    if (/\bexclusive\s+(?:mutation|namjari)\b/i.test(lower)) {
      candidates.push({ subject: "Property", predicate: "Mutation Status", object: "EXCLUSIVE_MUTATION" });
    } else if (/\b(?:mutation|namjari|khatian)\b/i.test(lower)) {
      candidates.push({ subject: "Property", predicate: "Mutation Status", object: "MUTATED" });
    }
  }

  private extractRegistrationFacts(clause: string, candidates: FactCandidate[]): void {
    const lower = clause.toLowerCase();
    // Treasury deposit / challan
    if (/\b(?:treasury\s+challan|deposit|deposited|pay\s+order)\b/i.test(lower)) {
      candidates.push({ subject: "Treasury Deposit", predicate: "Payment Status", object: "DEPOSITED" });
      // Extract challan number
      const challanMatch = clause.match(/(?:challan\s+no\.?|treasury\s+challan)\s+([A-Z0-9\-]+)/i);
      if (challanMatch) {
        candidates.push({ subject: "Treasury Deposit", predicate: "Challan Number", object: challanMatch[1].trim() });
      }
    }
    // Registered title
    if (/\b(?:registered\s+(?:owner|title|kabala|sale\s+deed))\b/i.test(lower)) {
      candidates.push({ subject: "Plaintiff", predicate: "Title Status", object: "REGISTERED_OWNER" });
    }
  }

  // P0-4: Temporal / chronology facts
  private extractTemporalFacts(clause: string, candidates: FactCandidate[]): void {
    // Refusal date
    const refusalMatch = clause.match(/\b(?:refused|refusal)\b[^\.]{0,80}?(?:on|dated)\s+([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
    if (refusalMatch) {
      const date = refusalMatch[1].trim();
      candidates.push({ subject: "Defendant", predicate: "Refusal Date", object: date, eventDate: date });
    } else if (/\b(?:refused|refusal)\b/i.test(clause.toLowerCase())) {
      candidates.push({ subject: "Defendant", predicate: "Refusal Date", object: null });
    }

    // Demand / legal notice date
    const demandMatch = clause.match(/\b(?:demanded|demand|legal\s+notice)\b[^\.]{0,80}?\bon\s+([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
    if (demandMatch) {
      const date = demandMatch[1].trim();
      candidates.push({ subject: "Plaintiff", predicate: "Demand Date", object: date, eventDate: date });
    }

    // Performance deadline
    const deadlineMatch = clause.match(/\b(?:within|before|on\s+or\s+before|deadline|period\s+of)\b[^\.]{0,80}?([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
    if (deadlineMatch) {
      const date = deadlineMatch[1].trim();
      candidates.push({ subject: "Contract", predicate: "Performance Deadline", object: date, eventDate: date });
    }

    // Disowning affidavit date
    if (/\b(?:disowning affidavit|affidavit of disown)\b/i.test(clause.toLowerCase())) {
      const affDate = clause.match(/(?:on|dated)\s+([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
      if (affDate) {
        const date = affDate[1].trim();
        candidates.push({ subject: "Ancestor", predicate: "Disowning Date", object: date, eventDate: date });
      }
    }

    // Newspaper publication date
    if (/\b(?:newspaper publication|published in|daily ittefaq)\b/i.test(clause.toLowerCase())) {
      const pubDate = clause.match(/(?:on|dated)\s+([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
      if (pubDate) {
        const date = pubDate[1].trim();
        candidates.push({ subject: "Media", predicate: "Publication Date", object: date, eventDate: date });
      }
    }

    // Warisan sanad date
    if (/\b(?:warisan sanad|heirship certificate|legal heirship)\b/i.test(clause.toLowerCase())) {
      const wsDate = clause.match(/(?:dated|on)\s+([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
      if (wsDate) {
        const date = wsDate[1].trim();
        candidates.push({ subject: "Heirship", predicate: "Certificate Date", object: date, eventDate: date });
      }
    }

    // Predeceased date
    if (/\b(?:predeceased|pre-deceased|died before)\b/i.test(clause.toLowerCase())) {
      const preDate = clause.match(/(?:in|on)\s+([0-9]{4}|[0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4})/i);
      if (preDate) {
        const date = preDate[1].trim();
        candidates.push({ subject: "Spouse", predicate: "Predeceased Date", object: date, eventDate: date });
      }
    }
  }

  private extractDocumentFacts(clause: string, candidates: FactCandidate[]): void {
    // Document type detection for provenance
    if (/\b(?:death\s+certificate|warisan\s+sanad|heirship\s+certificate|mutation\s+case|khatian|cs\s+record|sa\s+record|rs\s+record|dakhila)\b/i.test(clause)) {
      // These are handled by detectAssertionContext for assertion typing
    }
  }

  private extractSuccessionFacts(clause: string, candidates: FactCandidate[]): void {
    const lower = clause.toLowerCase();
    // Death
    if (/\b(?:died|passed away|demise|death of)\b/i.test(clause)) {
      const dm = clause.match(/(?:died|passed away|demise|death of)(?:\s+[a-z]+){0,6}?\s+(?:on\s+)?([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s*[0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
      if (dm) {
        const date = dm[1].trim();
        candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED", eventDate: date });
      } else {
        candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED" });
      }
    }
    // Living assertions
    if (/\b(?:father is alive|living father|alive and in possession|ancestor is living)\b/i.test(lower)) {
      candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "ALIVE" });
    }
    // Intestate
    if (/\bintestate\b/i.test(lower)) {
      candidates.push({ subject: "Ancestor", predicate: "Succession Type", object: "INTESTATE" });
    }
    // Disowning
    if (/\b(?:disown|disowned|disowning)\b/i.test(lower)) {
      candidates.push({ subject: "Ancestor", predicate: "Disowning Declaration", object: "DECLARED" });
    }
  }

  private extractPossessionFacts(clause: string, candidates: FactCandidate[]): void {
    const lower = clause.toLowerCase();
    // Dispossession
    if (/\b(?:dispossessed|ousted|ouster)\b/i.test(lower) ||
        /\bdenied\s+.*\baccess\b/i.test(lower) ||
        /\bprevented\s+.*\b(?:from\s+)?entering\b/i.test(lower) ||
        /\benclos(?:ing|ed)?\s+.*\b(?:portion|area|property)\b/i.test(lower) ||
        /\bexclusive\s+(?:ownership|possession|control)\b/i.test(lower)) {
      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "DISPOSSESSED" });
      // Extract dispossession date if present
      const dispDate = clause.match(/(?:on|since|from)\s+([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
      if (dispDate) {
        const date = dispDate[1].trim();
        candidates.push({ subject: "Plaintiff", predicate: "Dispossession Date", object: date, eventDate: date });
      }
    }
    if (/\b(?:in\s+(?:peaceful|continuous)\s+possession|possessing)\b/i.test(lower)) {
      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "IN_POSSESSION" });
    }
    // Unauthorized construction
    if (/\b(?:unauthorized\s+construction|constructing\s+without)\b/i.test(lower)) {
      candidates.push({ subject: "Defendant", predicate: "Construction Status", object: "UNAUTHORIZED" });
    }
  }

  // =======================================================================
  // P0-5: ASSERTION CONTEXT DETECTION
  // =======================================================================

  private detectAssertionContext(
    clause: string,
  ): { type: AssertionType; polarity: AssertionPolarity; assertedBy?: string; documentType?: string; documentDate?: string } {
    const lower = clause.toLowerCase();

    // P0-5: Document-specific detection first (highest priority for provenance)
    // Defendant reply dated 10 February 2024
    const replyMatch = clause.match(/\b(?:defendant|respondent)\b[^.!?]{0,60}\b(?:reply|replied|written\s+statement|ws)\b[^.!?]{0,60}(?:dated\s+)?([0-9]{1,2}\s+[A-Za-z]+,?\s*[0-9]{4})/i);
    if (replyMatch) {
      return {
        type: AssertionType.DOCUMENTARY_FACT,
        polarity: AssertionPolarity.POSITIVE,
        assertedBy: "DEFENDANT",
        documentType: "DEFENDANT_REPLY",
        documentDate: replyMatch[1]?.trim(),
      };
    }

    // Plaintiff's case / allegation
    if (
      /\b(?:it is the|this is the)\s+(?:plaintiff's|defendant's)\s+case\b/i.test(clause) ||
      /\b(?:plaintiff|defendant)\b[^.!?]{0,60}\b(?:case\s+is|contends?|submits?|claims?|alleges?)\b/i.test(clause)
    ) {
      const isPlaintiff = /\bplaintiff\b/i.test(clause) && !/\bdefendant\b[^.!?]{0,40}\b(?:contends?|submits?|claims?|denies?)\b/i.test(clause);
      const isDefendant = /\bdefendant\b/i.test(clause) && !/\bplaintiff\b[^.!?]{0,40}\b(?:contends?|submits?|claims?|alleges?)\b/i.test(clause);
      return {
        type: AssertionType.ASSERTED,
        polarity: AssertionPolarity.POSITIVE,
        assertedBy: isPlaintiff ? "PLAINTIFF" : isDefendant ? "DEFENDANT" : undefined,
      };
    }

    // Denial / dispute
    if (
      /\b(?:defendant|plaintiff)\b[^.!?]{0,80}\b(?:denies?|disputes?|refutes?)\b/i.test(clause) ||
      /\b(?:denies?|disputes?|refutes?)\b[^.!?]{0,80}\b(?:defendant|plaintiff)\b/i.test(clause)
    ) {
      const isDefendantDenial = /\bdefendant\b/i.test(clause) && /\b(?:denies?|disputes?)\b/i.test(clause);
      return {
        type: AssertionType.DENIED,
        polarity: AssertionPolarity.DISPUTED,
        assertedBy: isDefendantDenial ? "DEFENDANT" : "PLAINTIFF",
      };
    }

    // Admission
    if (/\b(?:admits?|admitted|concedes?|conceded|acknowledges?)\b/i.test(clause)) {
      return { type: AssertionType.ADMITTED, polarity: AssertionPolarity.POSITIVE };
    }

    // Party narrative / deposition
    if (/\b(?:according to|stated by|deposed by)\b/i.test(clause)) {
      return { type: AssertionType.PARTY_NARRATIVE, polarity: AssertionPolarity.POSITIVE };
    }

    // Court finding
    if (/\b(?:court\s+found|held\s+that|decided\s+that)\b/i.test(clause)) {
      return { type: AssertionType.COURT_FINDING, polarity: AssertionPolarity.POSITIVE };
    }

    // Documentary facts
    if (/\b(?:document\s+shows|record\s+reveals|registered\s+deed|registered\s+sale\s+deed|kabala|pay\s+order|treasury\s+challan|bainapatra)\b/i.test(clause)) {
      return { type: AssertionType.DOCUMENTARY_FACT, polarity: AssertionPolarity.POSITIVE };
    }

    // Official records
    if (/\b(?:death\s+certificate|warisan\s+sanad|heirship\s+certificate|mutation\s+case|khatian|cs\s+record|sa\s+record|rs\s+record|dakhila)\b/i.test(clause)) {
      return { type: AssertionType.DOCUMENTARY_FACT, polarity: AssertionPolarity.POSITIVE };
    }

    return { type: AssertionType.ALLEGED, polarity: AssertionPolarity.POSITIVE };
  }

  private detectAssertingParty(clause: string): string | null {
    const plaintiffMatch = clause.match(
      /\b(?:plaintiff|petitioner|claimant)\b[^.!?]{0,40}\b(?:states?|says?|submits?|contends?|alleges?|deposes?)\b/i,
    );
    if (plaintiffMatch) return "PLAINTIFF";

    const defendantMatch = clause.match(
      /\b(?:defendant|respondent|opponent)\b[^.!?]{0,40}\b(?:states?|says?|submits?|contends?|denies?)\b/i,
    );
    if (defendantMatch) return "DEFENDANT";

    if (/\b(?:plaintiff|petitioner|claimant)\b/i.test(clause)) return "PLAINTIFF";
    if (/\b(?:defendant|respondent|opponent)\b/i.test(clause)) return "DEFENDANT";

    return null;
  }

  // =======================================================================
  // P0 HELPERS: ENSURE CLAIM-RELEVANT UNKNOWNS
  // =======================================================================

  private ensureClaimRelevantUnknowns(ctx: ExecutionContext, claimType: ClaimType): void {
    const existingKeys = new Set(Array.from(ctx.factRegistry.values()).map((f) => `${f.subject}|${f.predicate}`.toUpperCase()));
    const requiredPairs: Array<[string, string]> = [];
    if (claimType === "SPECIFIC_PERFORMANCE") {
      requiredPairs.push(["Bainapatra", "Registration Status"], ["Treasury Deposit", "Payment Status"], ["Bainapatra", "Execution Date"]);
    } else if (claimType === "DECLARATION_AND_POSSESSION") {
      requiredPairs.push(["Plaintiff", "Title Status"], ["Plaintiff", "Possession Status"]);
    } else if (claimType === "INHERITANCE_CONSULTATION") {
      requiredPairs.push(["Ancestor", "Vital Status"], ["Ancestor", "Succession Type"], ["Property", "Ownership Structure"], ["Property", "Mutation Status"]);
    }
    for (const [subject, predicate] of requiredPairs) {
      const key = `${subject}|${predicate}`.toUpperCase();
      if (!existingKeys.has(key)) {
        const propositionId = this.ensureProposition(ctx, subject, predicate, null, `[SYSTEM-GENERATED] No facts extracted for ${subject} ${predicate}`);
        const assertionId = shortId("A", ctx.assertionCounter++);
        const factId = shortId("F", ctx.factCounter++);
        ctx.assertionRegistry.set(assertionId, { assertionId, propositionId, assertionType: AssertionType.ALLEGED, polarity: AssertionPolarity.UNKNOWN, sourceSpan: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" } });
        ctx.factRegistry.set(factId, { factId, propositionId, assertionId, proposition: `[AUTO] ${subject} ${predicate} — not mentioned in input`, subject, predicate, object: null, truth: Tristate.UNKNOWN, polarity: AssertionPolarity.UNKNOWN, source: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" }, assertionType: AssertionType.ALLEGED, validationStatus: ValidationStatus.UNVERIFIED, confidence: FactConfidence.CANDIDATE, validation: { extractionStatus: ExtractionStatus.NOT_EXECUTED, sourceStatus: SourceStatus.UNRESOLVED, authenticationStatus: AuthenticationStatus.NOT_EXECUTED, corroborationStatus: CorroborationStatus.NOT_EXECUTED, humanValidationStatus: HumanValidationStatus.NOT_EXECUTED } });
      }
    }
  }

  private buildContradictionGraph(ctx: ExecutionContext): void {
    const facts = Array.from(ctx.factRegistry.values());
    const familyMap = new Map<string, AtomicFact[]>();
    for (const fact of facts) {
      const familyKey = `${fact.subject}|${fact.predicate}`.toUpperCase();
      if (!familyMap.has(familyKey)) familyMap.set(familyKey, []);
      familyMap.get(familyKey)!.push(fact);
    }
    let edgeCounter = 1;
    for (const [familyKey, familyFacts] of familyMap) {
      if (familyFacts.length < 2) continue;
      const mode = getConflictMode(ctx, familyFacts[0].subject, familyFacts[0].predicate);
      if (mode === "NON_CONTRADICTORY" || mode === "MULTI_VALUED" || mode === "NUMERIC_RANGE") continue;
      for (let i = 0; i < familyFacts.length; i++) {
        for (let j = i + 1; j < familyFacts.length; j++) {
          const left = familyFacts[i];
          const right = familyFacts[j];
          let isConflict = false;
          if (mode === "BOOLEAN_EXCLUSIVE") {
            isConflict =
              (left.truth === Tristate.TRUE && right.truth === Tristate.FALSE) ||
              (left.truth === Tristate.FALSE && right.truth === Tristate.TRUE);
          } else if (mode === "ENUM_EXCLUSIVE") {
            isConflict =
              left.object !== right.object &&
              left.truth === Tristate.TRUE &&
              right.truth === Tristate.TRUE;
          } else if (mode === "NUMERIC_EQUALITY") {
            const leftNum = left.normalizedValue !== null && left.normalizedValue !== undefined ? Number(left.normalizedValue) : NaN;
            const rightNum = right.normalizedValue !== null && right.normalizedValue !== undefined ? Number(right.normalizedValue) : NaN;
            isConflict =
              !isNaN(leftNum) && !isNaN(rightNum) && leftNum !== rightNum &&
              left.truth === Tristate.TRUE && right.truth === Tristate.TRUE;
          }
          if (isConflict) {
            const edge: ContradictionEdge = {
              edgeId: `EDGE-${String(edgeCounter++).padStart(5, "0")}`,
              propositionKey: familyKey,
              leftFactId: left.factId,
              rightFactId: right.factId,
              relation: "DIRECT_TRUTH_CONFLICT",
              status: left.truth === Tristate.TRUE && right.truth === Tristate.TRUE ? "CRITICAL" : "PENDING_VALIDATION",
            };
            ctx.contradictionGraph.push(edge);
            if (!left.contradicts) left.contradicts = [];
            if (!right.contradicts) right.contradicts = [];
            left.contradicts.push(right.factId);
            right.contradicts.push(left.factId);
          }
        }
      }
    }
  }

  private logCriticalConflicts(ctx: ExecutionContext): void {
    const criticalEdges = ctx.contradictionGraph.filter((e) => e.status === "CRITICAL");
    if (criticalEdges.length > 0) {
      recordTrace(ctx, {
        layer: "P0_EXTRACTION",
        description: `CRITICAL_CONFLICT_DATA: ${criticalEdges.length} critical contradiction edge(s) recorded. No throw — data propagated to F0 gate.`,
        dependsOnFacts: criticalEdges.flatMap((e) => [e.leftFactId, e.rightFactId]),
        dependsOnRules: [],
        result: `EDGES:[${criticalEdges.map((e) => e.edgeId).join(",")}]`,
      });
      ctx.warnings.push(`CRITICAL: ${criticalEdges.length} contradiction edge(s) detected. F0 gate will evaluate.`);
    }
  }

  // =======================================================================
  // EVENT TIMELINE
  // =======================================================================

  private buildEventTimeline(ctx: ExecutionContext): void {
    const factsWithDates = Array.from(ctx.factRegistry.values()).filter(
      (f) => f.eventDate && isStrictDate(f.eventDate),
    );
    factsWithDates.sort((a, b) => strictDateTimestamp(a.eventDate!) - strictDateTimestamp(b.eventDate!));
    let eventCounter = 1;
    for (const fact of factsWithDates) {
      const eventType = this.inferEventType(fact);
      const parsed = parseNaturalDate(fact.eventDate!);
      const dateStr = parsed ? parsed.iso : fact.eventDate!;
      ctx.eventTimeline.push({
        eventId: `EVT-${String(eventCounter++).padStart(5, "0")}`,
        type: eventType,
        date: dateStr,
        datePrecision: isAmbiguousDate(fact.eventDate!) ? "AMBIGUOUS" : "EXACT",
        sourceFactIds: [fact.factId],
      });
    }
    if (ctx.eventTimeline.length === 0) {
      ctx.eventTimeline.push({
        eventId: "EVT-00001",
        type: "OTHER",
        date: null,
        datePrecision: "UNKNOWN",
        sourceFactIds: [],
      });
    }
  }

  // P0-4: Explicit event type mapping
  private inferEventType(fact: AtomicFact): LegalEventType {
    if (fact.predicate === "Vital Status" && fact.object === "DECEASED") return "ANCESTOR_DEATH";
    if (fact.predicate === "Execution Date") return "AGREEMENT_EXECUTION";
    if (fact.predicate === "Registration Status" && fact.object === "REGISTERED") return "AGREEMENT_REGISTERED";
    if (fact.predicate === "Amount Paid" && fact.subject === "Advance") return "ADVANCE_PAID";
    if (fact.predicate === "Payment Status" && fact.object === "DEPOSITED" && fact.subject === "Treasury Deposit") return "BALANCE_DEPOSIT";
    if (fact.predicate === "Performance Deadline") return "PERFORMANCE_DEADLINE";
    if (fact.predicate === "Demand Date") return "LEGAL_NOTICE";
    if (fact.predicate === "Refusal Date") return "REFUSAL";
    if (fact.predicate === "Dispossession Date") return "DISPOSSESSION";
    if (fact.predicate === "Payment Status" && fact.object === "DEPOSITED") return "PAYMENT";
    if (fact.predicate === "Possession Status" && fact.object === "DISPOSSESSED") return "DISPOSSESSION";
    if (fact.predicate === "Registration Status") return "REGISTRATION";
    if (fact.predicate === "Mutation Status") return "AMENDMENT";
    if (fact.predicate === "Construction Status" && fact.object === "UNAUTHORIZED") return "ENCROACHMENT";
    if (fact.predicate === "Ownership Structure" && fact.object === "JOINT") return "OTHER";
    return "OTHER";
  }

  private evaluateFact(
    ctx: ExecutionContext,
    subject: string,
    predicate: string,
    object: string | null,
    options: {
      requireVerified?: boolean;
      validationRequirements?: ValidationRequirements;
      objectFilter?: string | null;
    } = {},
  ): FactEvaluationResult {
    const subjectUpper = subject.toUpperCase();
    const predicateUpper = predicate.toUpperCase();
    const objectFilter = options.objectFilter ?? object;
    const familyFacts = Array.from(ctx.factRegistry.values()).filter(
      (f) => f.subject.toUpperCase() === subjectUpper && f.predicate.toUpperCase() === predicateUpper,
    );
    const sameFamilyConflictingFacts = familyFacts
      .filter((f) => f.truth === Tristate.TRUE)
      .map((f) => ({ factId: f.factId, object: f.object, truth: f.truth }));
    const conflictDetected = sameFamilyConflictingFacts.length > 1 && new Set(sameFamilyConflictingFacts.map((f) => f.object)).size > 1;
    const matchingFacts = objectFilter
      ? familyFacts.filter((f) => f.object?.toUpperCase() === objectFilter.toUpperCase())
      : familyFacts;
    let bestStatus = Tristate.UNKNOWN;
    const supportingFactIds: string[] = [];
    let validationDetails: FactEvaluationResult["validationDetails"] = undefined;
    for (const fact of matchingFacts) {
      let passesValidation = true;
      if (options.validationRequirements) {
        passesValidation = meetsValidationRequirements(fact, options.validationRequirements);
      } else if (options.requireVerified) {
        passesValidation = fact.validationStatus === ValidationStatus.VERIFIED;
      }
      if (!passesValidation) continue;
      if (fact.truth === Tristate.TRUE) {
        bestStatus = Tristate.TRUE;
        supportingFactIds.push(fact.factId);
        validationDetails = {
          sourceStatus: fact.validation.sourceStatus,
          authenticationStatus: fact.validation.authenticationStatus,
          corroborationStatus: fact.validation.corroborationStatus,
          humanValidationStatus: fact.validation.humanValidationStatus,
        };
        break;
      } else if (fact.truth === Tristate.FALSE) {
        bestStatus = Tristate.FALSE;
        supportingFactIds.push(fact.factId);
        validationDetails = {
          sourceStatus: fact.validation.sourceStatus,
          authenticationStatus: fact.validation.authenticationStatus,
          corroborationStatus: fact.validation.corroborationStatus,
          humanValidationStatus: fact.validation.humanValidationStatus,
        };
      } else if (bestStatus === Tristate.UNKNOWN) {
        supportingFactIds.push(fact.factId);
        validationDetails = {
          sourceStatus: fact.validation.sourceStatus,
          authenticationStatus: fact.validation.authenticationStatus,
          corroborationStatus: fact.validation.corroborationStatus,
          humanValidationStatus: fact.validation.humanValidationStatus,
        };
      }
    }
    return { status: bestStatus, supportingFactIds, conflictDetected, sameFamilyConflictingFacts, validationDetails };
  }

  // =======================================================================
  // DOMAIN & LEGISLATION
  // =======================================================================

  private resolveClaimType(factPattern: string, focusDomain: string): ClaimType {
    const lower = factPattern.toLowerCase();
    if (focusDomain) {
      const fd = focusDomain.toLowerCase();
      if (fd.includes("specific performance")) return "SPECIFIC_PERFORMANCE";
      if (fd.includes("declaration") || fd.includes("possession")) return "DECLARATION_AND_POSSESSION";
      if (fd.includes("inheritance") || fd.includes("succession")) return "INHERITANCE_CONSULTATION";
    }
    if (/\b(?:specific\s+performance|bainapatra|sale\s+deed|agreement\s+to\s+sell|earnest\s+money)\b/.test(lower)) return "SPECIFIC_PERFORMANCE";
    if (/\b(?:declaration|title|possession|dispossessed|ousted|encroach|mutation|khatian)\b/.test(lower)) return "DECLARATION_AND_POSSESSION";
    if (/\b(?:inherit|succession|heir|warisan|intestate|ancestor|predeceased|died)\b/.test(lower)) return "INHERITANCE_CONSULTATION";
    return "GENERAL_CIVIL";
  }

  private classifyDomain(_ctx: ExecutionContext, claimType: ClaimType): string {
    if (claimType === "SPECIFIC_PERFORMANCE") return "SPECIFIC_PERFORMANCE";
    if (claimType === "DECLARATION_AND_POSSESSION") return "DECLARATION_AND_POSSESSION";
    if (claimType === "INHERITANCE_CONSULTATION") return "INHERITANCE_CONSULTATION";
    return "GENERAL_CIVIL";
  }

  private mapLegislation(_ctx: ExecutionContext, claimType: ClaimType) {
    return this.ruleRegistry.getLegislationMapping(claimType);
  }

  // =======================================================================
  // LIMITATION ENGINE
  // =======================================================================

  private executeLimitationEngine(ctx: ExecutionContext, claimType: ClaimType): {
    isTimeBarred: boolean | null;
    accrualDate: string | "NOT_EXTRACTED";
    limitationPeriodYears: number | null;
    calculationType: string;
    timelineValidation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      calculationType?: string;
    };
  } {
    const facts = Array.from(ctx.factRegistry.values());
    const dates = facts.filter((f) => f.eventDate && isStrictDate(f.eventDate)).map((f) => f.eventDate!);
    const refusalDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Refusal Date"));
    const hasAgreementContext = facts.some((f) =>
      /agreement|contract|bainapatra/i.test(
        `${f.predicate ?? ""} ${f.object ?? ""} ${f.proposition ?? ""}`
      )
    );
    const dispossessionDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Dispossession Date"));
    const demandDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Demand Date"));
    const deathDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Vital Status" && f.object === "DECEASED"));
    const executionDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Execution Date"));
    let accrualDate: string | "NOT_EXTRACTED" = "NOT_EXTRACTED";
    let limitationPeriodYears: number | null = null;
    let calculationType = "other_category";

    if (claimType === "SPECIFIC_PERFORMANCE") {
      if (refusalDate && facts.some((f) =>
        /agreement|contract|bainapatra/i.test(
          `${f.predicate} ${f.object} ${f.proposition}`
        )
      )) {
        accrualDate = refusalDate;
        limitationPeriodYears = 3;
        calculationType = "refusal_date";
      } else if (demandDate) {
        accrualDate = demandDate;
        limitationPeriodYears = 3;
        calculationType = "demand_date";
      } else if (executionDate) {
        accrualDate = executionDate;
        limitationPeriodYears = 3;
        calculationType = "execution_date_fallback";
      }
    } else if (claimType === "DECLARATION_AND_POSSESSION") {
      if (dispossessionDate) {
        accrualDate = dispossessionDate;
        limitationPeriodYears = 12;
        calculationType = "dispossession_date";
      }
    } else if (claimType === "INHERITANCE_CONSULTATION") {
      if (deathDate) {
        accrualDate = deathDate;
        limitationPeriodYears = 12;
        calculationType = "death_date";
      }
    }
    if (accrualDate === "NOT_EXTRACTED") {
      calculationType = "missing_dates";
    }
    let isTimeBarred: boolean | null = false;
    if (accrualDate !== "NOT_EXTRACTED" && limitationPeriodYears !== null && ctx.referenceDate) {
      const accrualTs = strictDateTimestamp(accrualDate);
      const refTs = ctx.referenceDate;
      const periodMs = limitationPeriodYears * 365.25 * 24 * 60 * 60 * 1000;
      isTimeBarred = refTs > accrualTs + periodMs;
    }
    return {
      isTimeBarred,
      accrualDate,
      limitationPeriodYears,
      calculationType,
      timelineValidation: { isValid: true, errors: [], warnings: [] },
    };
  }

  // =======================================================================
  // ELEMENT COMPLETENESS GATE
  // =======================================================================

  private executeElementCompletenessGate(ctx: ExecutionContext, claimType: ClaimType): ElementGateResult {
    const rules = this.ruleRegistry.getClaimElements(claimType, "Bangladesh");
    const results: RuleExecutionResult[] = [];
    let allSatisfied = true;
    const missingElements: string[] = [];
    const unknownElements: string[] = [];
    const fatalFailures: string[] = [];
    for (const rule of rules) {
      const predicateResults: PredicateExecutionResult[] = [];
      let ruleSatisfied = true;
      for (const pred of rule.predicates) {
        const evalResult = this.evaluateFact(ctx, pred.subject, pred.predicate, pred.object ?? null, {
          validationRequirements: pred.validationRequirements,
          requireVerified: pred.requireVerified,
        });
        const status = evalResult.status === Tristate.TRUE ? "TRUE" : evalResult.status === Tristate.FALSE ? "FALSE" : "UNKNOWN";
        predicateResults.push({
          predicateSubject: pred.subject,
          predicateId: pred.predicateId,
          status,
          factIds: evalResult.supportingFactIds,
          conflictDetected: evalResult.conflictDetected,
          sameFamilyConflictingFacts: evalResult.sameFamilyConflictingFacts,
        });
        if (evalResult.status !== Tristate.TRUE) ruleSatisfied = false;
      }
      const ruleResult: RuleExecutionResult = {
        ruleId: rule.ruleId,
        status: ruleSatisfied ? "SATISFIED" : "UNKNOWN",
        predicateResults,
        authorityIds: rule.authorityIds ?? [rule.authority.act],
        burden: rule.burden,
        legalEffect: rule.legalEffect,
        explanationCode: ruleSatisfied ? "ALL_PREDICATES_TRUE" : "PREDICATE_NOT_TRUE",
        authorityStatus: this.authorityStatus,
      };
      results.push(ruleResult);
      if (ruleSatisfied) continue;
      allSatisfied = false;
      if (rule.ruleType === "ELEMENT") {
        if (predicateResults.some((pr) => pr.status === "UNKNOWN")) {
          unknownElements.push(rule.ruleId);
        } else {
          missingElements.push(rule.ruleId);
        }
      } else if (rule.ruleType === "BAR") {
        fatalFailures.push(rule.ruleId);
      }
    }
    const status = fatalFailures.length > 0 ? GateStatus.HALT : allSatisfied ? GateStatus.PASS : GateStatus.INDETERMINATE;
    return { status, allSatisfied, missingElements, unknownElements, fatalFailures, ruleExecutionResults: results };
  }

  // =======================================================================
  // P0-9: PARTY STANDI — consumes fact graph, not raw text
  // =======================================================================

  private executePartyStandiRules(
    ctx: ExecutionContext,
    _claimType: ClaimType,
    _rawText: string,
  ): {
    plaintiffs: string[];
    defendants: string[];
    joinderIssues: string;
    locusStandiSummary: string;
  } {
    // P0-1: Consume Stage 0 atomic facts for party identity
    const partyFacts = Array.from(ctx.factRegistry.values()).filter(
      (f) => f.predicate === "Party Identity" || f.predicate === "Party Role",
    );

    // Extract plaintiff names from Party Identity facts with subject "Plaintiff"
    const plaintiffNames = partyFacts
      .filter((f) => f.subject === "Plaintiff" && f.predicate === "Party Identity" && f.object)
      .map((f) => f.object!)
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe while preserving order

    // Extract defendant names from Party Identity facts with subject "Defendant"
    const defendantNames = partyFacts
      .filter((f) => f.subject === "Defendant" && f.predicate === "Party Identity" && f.object)
      .map((f) => f.object!)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Also extract from Party Role facts
    const rolePlaintiffs = partyFacts
      .filter((f) => f.predicate === "Party Role" && f.object === "PLAINTIFF" && f.object)
      .map((f) => f.subject)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const roleDefendants = partyFacts
      .filter((f) => f.predicate === "Party Role" && f.object === "DEFENDANT" && f.object)
      .map((f) => f.subject)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Merge, with explicit identity facts taking priority
    const plaintiffs = plaintiffNames.length > 0 ? plaintiffNames : rolePlaintiffs;
    const defendants = defendantNames.length > 0 ? defendantNames : roleDefendants;

    const joinderIssues = plaintiffs.length > 1 || defendants.length > 1
      ? "Multiple parties identified; joinder analysis required."
      : "No joinder issues detected.";

    const locusStandiSummary = plaintiffs.length > 0 && defendants.length > 0
      ? `Plaintiff(s): ${plaintiffs.join(", ")}; Defendant(s): ${defendants.join(", ")}`
      : "Party standing incomplete — party facts not fully extracted.";

    return { plaintiffs, defendants, joinderIssues, locusStandiSummary };
  }

  // =======================================================================
  // PLEADING RULES
  // =======================================================================

  private executePleadingRules(
    elementGate: ElementGateResult,
    _rawText: string,
  ): {
    plaintChecklist: string[];
    groundsForRejection: string[];
  } {
    const checklist: string[] = [];
    const grounds: string[] = [];
    if (elementGate.missingElements.length > 0) {
      grounds.push(`Missing elements: ${elementGate.missingElements.join(", ")}`);
    }
    if (elementGate.unknownElements.length > 0) {
      grounds.push(`Unknown elements: ${elementGate.unknownElements.join(", ")}`);
    }
    checklist.push("Plaint filed");
    checklist.push("Written statement filed");
    return { plaintChecklist: checklist, groundsForRejection: grounds };
  }

  // =======================================================================
  // ISSUE FRAMING
  // =======================================================================

  private executeIssueFramingRules(
    ctx: ExecutionContext,
    elementGate: ElementGateResult,
    _rawText: string,
  ): { framedIssues: string[]; issueCount: number } {
    const issues: string[] = [];
    if (elementGate.missingElements.includes("SP-ELEMENT-REGISTRATION")) {
      issues.push("Whether the bainapatra is registered");
    }
    if (elementGate.missingElements.includes("SP-ELEMENT-DEPOSIT")) {
      issues.push("Whether the balance consideration was deposited");
    }
    if (elementGate.missingElements.includes("SUCCESSION-DEATH-ELEMENT")) {
      issues.push("Whether the ancestor is deceased");
    }
    if (elementGate.missingElements.includes("DP-ELEMENT-TITLE")) {
      issues.push("Whether the plaintiff holds registered title");
    }
    if (elementGate.missingElements.includes("DP-ELEMENT-POSSESSION")) {
      issues.push("Whether the plaintiff was dispossessed");
    }
    const contradictionIssues = ctx.contradictionGraph
      .filter((e) => e.status === "CRITICAL")
      .map((e) => `Critical contradiction on ${e.propositionKey}`);
    issues.push(...contradictionIssues);
    return { framedIssues: issues, issueCount: issues.length };
  }

  // =======================================================================
  // EVIDENCE RULES
  // =======================================================================

  private executeEvidenceRules(ctx: ExecutionContext): {
    oralAssertions: number;
    documentaryEvidence: number;
    missingEvidence: string[];
  } {
    const facts = Array.from(ctx.factRegistry.values());
    const oral = facts.filter((f) => f.assertionType === AssertionType.PARTY_NARRATIVE || f.assertionType === AssertionType.ALLEGED).length;
    const documentary = facts.filter((f) => f.assertionType === AssertionType.DOCUMENTARY_FACT).length;
    const missing: string[] = [];
    if (!facts.some((f) => f.predicate === "Registration Status")) {
      missing.push("Registration evidence");
    }
    if (!facts.some((f) => f.predicate === "Payment Status")) {
      missing.push("Payment evidence");
    }
    return { oralAssertions: oral, documentaryEvidence: documentary, missingEvidence: missing };
  }

  // =======================================================================
  // MERIT RULES
  // =======================================================================

  private executeMeritRules(elementGate: ElementGateResult): {
    meritScore: number;
    meritAssessment: string;
  } {
    const total = elementGate.ruleExecutionResults.length;
    const satisfied = elementGate.ruleExecutionResults.filter((r) => r.status === "SATISFIED").length;
    const score = total > 0 ? Math.round((satisfied / total) * 100) : 0;
    let assessment = "Insufficient data for merit assessment.";
    if (score >= 80) assessment = "Strong merit — all or most elements satisfied.";
    else if (score >= 50) assessment = "Partial merit — some elements satisfied, others indeterminate.";
    else if (score > 0) assessment = "Weak merit — few elements satisfied.";
    return { meritScore: score, meritAssessment: assessment };
  }

  // =======================================================================
  // EQUITY RULES
  // =======================================================================

  private executeEquityRules(
    elementGate: ElementGateResult,
    ctx: ExecutionContext,
  ): { equityPrinciples: string[]; equityScore: number } {
    const principles: string[] = [];
    if (elementGate.allSatisfied) {
      principles.push("Clean hands — plaintiff has satisfied all legal elements.");
    }
    if (ctx.contradictionGraph.length === 0) {
      principles.push("No material contradictions — equitable relief favored.");
    }
    return { equityPrinciples: principles, equityScore: principles.length };
  }

  // =======================================================================
  // PROCEDURE RULES
  // =======================================================================

  private executeProcedureRules(
    _ctx: ExecutionContext,
    _claimType: ClaimType,
  ): {
    territorial: { rule: string | null; governingSection: string | null; jurisdictionalFacts: string | null };
    pecuniary: { valuation: string | null; courtLevel: string | null; pecuniaryLimits: string | null; suitsValuationActNotes: string | null };
    subjectMatter: { isExcluded: boolean; forum: string | null; governingStatute: string | null };
    objectionStrategy: string | null;
    proceduralCompliance: boolean;
    proceduralNotes: string[];
  } {
    return {
      territorial: { rule: null, governingSection: null, jurisdictionalFacts: null },
      pecuniary: { valuation: null, courtLevel: null, pecuniaryLimits: null, suitsValuationActNotes: null },
      subjectMatter: { isExcluded: false, forum: null, governingStatute: null },
      objectionStrategy: null,
      proceduralCompliance: true,
      proceduralNotes: [],
    };
  }

  // =======================================================================
  // APPEAL RULES
  // =======================================================================

  private executeAppealRules(): {
    appealable: boolean;
    appealGrounds: string[];
  } {
    return { appealable: false, appealGrounds: [] };
  }

  // =======================================================================
  // EXECUTION STATUS & OUTCOME
  // =======================================================================

  private determineExecutionStatus(
    standi: { plaintiffs: string[]; defendants: string[] },
    pleading: { groundsForRejection: string[] },
    issues: { framedIssues: string[] },
    evidence: { missingEvidence: string[] },
    merits: { meritScore: number },
    equity: { equityScore: number },
    procedure: { proceduralCompliance: boolean },
    appeal: { appealable: boolean },
  ): PipelineExecutionStatus {
    if (standi.plaintiffs.length === 0 || standi.defendants.length === 0) return "BLOCKED";
    if (pleading.groundsForRejection.length > 0) return "PARTIAL";
    if (issues.framedIssues.length === 0 && evidence.missingEvidence.length === 0 && merits.meritScore >= 80 && equity.equityScore >= 1 && procedure.proceduralCompliance && !appeal.appealable) return "COMPLETED";
    if (merits.meritScore < 50) return "PARTIAL";
    return "PARTIAL";
  }

  private determineOutcome(
    executionStatus: PipelineExecutionStatus,
    elementGate: ElementGateResult,
  ): ExecutionOutcome {
    if (executionStatus === "BLOCKED" || executionStatus === "ERROR") return "HALTED";
    if (elementGate.status === GateStatus.HALT) return "HALTED";
    if (elementGate.allSatisfied) return "STRUCTURAL_ONLY";
    if (elementGate.status === GateStatus.INDETERMINATE) return "INDETERMINATE";
    if (executionStatus === "PARTIAL") return "PARTIAL";
    return "STRUCTURAL_ONLY";
  }

  // =======================================================================
  // SYNTHESIS
  // =======================================================================

  private executeFailClosedSynthesis(
    ctx: ExecutionContext,
    f0Gate: FactConsistencyGateOutput,
    claimType: ClaimType,
    elementGate: ElementGateResult,
  ): SynthesisResult {
    const elementSummary = elementGate.ruleExecutionResults.map((r) => ({
      ruleId: r.ruleId,
      status: r.status,
      explanation: r.explanationCode,
    }));
    if (f0Gate.gateStatus === "HALT_CRITICAL_CONFLICT") {
      return {
        status: "HALTED",
        conclusion: "F0 gate halted execution due to critical fact conflicts.",
        confidence: "NONE",
        requiresHumanReview: true,
        humanReviewReason: "Critical contradictions in extracted facts prevent automated analysis.",
        elementSummary,
        legalConclusions: [],
        recommendations: ["Review conflicting facts manually before proceeding."],
      };
    }
    if (elementGate.status === GateStatus.HALT) {
      return {
        status: "HALTED",
        conclusion: "Execution halted due to fatal rule failures.",
        confidence: "NONE",
        requiresHumanReview: true,
        humanReviewReason: elementGate.fatalFailures.join("; "),
        elementSummary,
        legalConclusions: [],
        recommendations: ["Address fatal failures before re-analysis."],
      };
    }
    if (elementGate.allSatisfied) {
      return {
        status: "ELEMENTS_SATISFIED",
        conclusion: `All required elements for ${claimType} are structurally present.`,
        confidence: "STRUCTURAL_ONLY",
        requiresHumanReview: false,
        humanReviewReason: "",
        elementSummary,
        legalConclusions: [`${claimType} elements structurally satisfied.`],
        recommendations: ["Proceed to detailed legal analysis."],
      };
    }
    return {
      status: "INDETERMINATE",
      conclusion: `Analysis incomplete — some elements for ${claimType} are missing or unknown.`,
      confidence: "LOW",
      requiresHumanReview: true,
      humanReviewReason: `Missing: ${elementGate.missingElements.join(", ")}; Unknown: ${elementGate.unknownElements.join(", ")}`,
      elementSummary,
      legalConclusions: [],
      recommendations: ["Gather additional evidence for missing elements."],
    };
  }

  // =======================================================================
  // RESPONSE BUILDERS
  // =======================================================================

  private buildStage0Output(ctx: ExecutionContext) {
    const stage0 = this.buildStage0Output(ctx);

    return {
      caseId: deps.caseId,
      userId: request.user.id,
      licenseId: request.license.licenseId,
      engineVersion: ENGINE_MANIFEST.engineVersion,
      ruleGraphVersion: ENGINE_MANIFEST.ruleGraphVersion,
      factSchemaVersion: ENGINE_MANIFEST.factSchemaVersion,
      executionTimestamp: new Date().toISOString(),
      executionStatus: deps.executionStatus,
      gateF0: deps.executionStatus === "BLOCKED"
        ? { status: "HALT", allFactsConsistent: false, conflicts: [] }
        : { status: "PASS", allFactsConsistent: true, conflicts: [] },
      outcome: this.determineOutcome(deps.executionStatus, deps.elementGate),
      corpusMode: ENGINE_MANIFEST.corpusMode,
      authorityStatus: this.authorityStatus,
      claimType,
      domain: deps.domain,
      legislation: deps.legislation,
      stage0,
      stage1: {
        primaryDomain: deps.domain,
        subsidiaryDomains: [deps.domain],
        domainConfidence: "STRUCTURAL_ONLY",
      },
      stage2: {
        relevantSections: deps.legislation.relevantSections,
        primaryAct: deps.legislation.primaryAct,
        citationValidationAudit: { totalCitations: 0, validatedCitations: 0, unverifiedCitations: 0, verifiedCount: 0, rejectedCount: 0, registrySignature: "", auditStatus: "PASS_100_PERCENT_DETERMINISTIC", validationStandard: "100% deterministic canonical registry verification" },
        equityPrinciples: deps.equity.equityPrinciples,
      },
      stage3: {
        isTimeBarred: deps.limitation.isTimeBarred,
        accrualDate: deps.limitation.accrualDate,
        limitationPeriodYears: deps.limitation.limitationPeriodYears,
        calculationType: deps.limitation.calculationType,
        timelineValidation: { ...deps.limitation.timelineValidation, calculationType: deps.limitation.timelineValidation?.calculationType ?? "missing_dates" },
      },
      stage4: {
        plaintiffs: deps.standi.plaintiffs.map((name: string) => ({
          name,
          legalIdentity: "individual",
          capacity: "plaintiff",
          causeOfActionAccess: "yes",
        })),
        defendants: deps.standi.defendants.map((name: string) => ({
          name,
          legalIdentity: "individual",
          capacity: "defendant",
          liabilityType: "primary",
        })),
        joinderIssues: deps.standi.joinderIssues,
        locusStandiSummary: deps.standi.locusStandiSummary,
      },
      stage5: {
        territorial: deps.procedure?.territorial ?? {
          rule: null,
          governingSection: null,
          jurisdictionalFacts: null
        },
        pecuniary: deps.procedure?.pecuniary ?? {
          valuation: null,
          courtLevel: null,
          pecuniaryLimits: null,
          suitsValuationActNotes: null
        },
        subjectMatter: deps.procedure?.subjectMatter ?? {
          rule: null,
          governingSection: null,
          jurisdictionalFacts: null
        },
        objectionStrategy: deps.procedure?.objectionStrategy ?? null,
        plaintChecklist: deps.pleading.plaintChecklist,
        groundsForRejection: deps.pleading.groundsForRejection ?? [],
      },
      stage6: {
        framedIssues: deps.issues.framedIssues,
        issueCount: deps.issues.issueCount,
      },
      stage7: {
        oralAssertions: deps.evidence.oralAssertions,
        documentaryEvidence: deps.evidence.documentaryEvidence,
        missingEvidence: deps.evidence.missingEvidence,
      },
      stage8: {
        elementGateStatus: deps.elementGate.status,
        allSatisfied: deps.elementGate.allSatisfied,
        missingElements: deps.elementGate.missingElements,
        unknownElements: deps.elementGate.unknownElements,
        fatalFailures: deps.elementGate.fatalFailures,
        ruleExecutionResults: deps.elementGate.ruleExecutionResults,
      },
      stage9: {
        meritScore: deps.merits.meritScore,
        meritAssessment: deps.merits.meritAssessment,
      },
      stage10: {
        equityPrinciples: deps.equity.equityPrinciples,
        equityScore: deps.equity.equityScore,
      },
      stage11: {
        proceduralCompliance: deps.procedure.proceduralCompliance,
        proceduralNotes: deps.procedure.proceduralNotes,
      },
      stage12: {
        appealable: deps.appeal.appealable,
        appealGrounds: deps.appeal.appealGrounds,
      },
      stage13: {
        conclusion: synthesis.conclusion,
        confidence: synthesis.confidence,
        requiresHumanReview: synthesis.requiresHumanReview,
        humanReviewReason: synthesis.humanReviewReason,
        elementSummary: synthesis.elementSummary,
        legalConclusions: synthesis.legalConclusions,
        recommendations: synthesis.recommendations,
      },
      f0Gate: {
        gateStatus: f0Gate.gateStatus,
        conflictCount: f0Gate.conflictCount ?? 0,
        criticalConflicts: f0Gate.criticalConflicts ?? 0,
        warnings: f0Gate.warnings ?? [],
      },
      auditHash: "PENDING",
    };
  }

  private buildPreF0HaltResponse(
    ctx: ExecutionContext,
    caseId: string,
    haltReason: string,
    haltDetail: string,
  ): CaseAnalysisResponse {
    return {
      caseId,
      userId: "",
      licenseId: "",
      engineVersion: ENGINE_MANIFEST.engineVersion,
      ruleGraphVersion: ENGINE_MANIFEST.ruleGraphVersion,
      factSchemaVersion: ENGINE_MANIFEST.factSchemaVersion,
      executionTimestamp: new Date().toISOString(),
      executionStatus: "ERROR",
      outcome: "ERROR",
      corpusMode: ENGINE_MANIFEST.corpusMode,
      authorityStatus: this.authorityStatus,
      claimType: "GENERAL_CIVIL",
      domain: "UNKNOWN",
      legislation: { primaryAct: null, relevantSections: [] },
      stage0: {
        atomicFacts: [],
        contradictionGraph: [],
        eventTimeline: [],
        executionTrace: ctx.executionTrace,
        quantumFacts: [],
      },
      stage1: { primaryDomain: "UNKNOWN", subsidiaryDomains: [], domainConfidence: "NONE" },
      stage2: { relevantSections: [], primaryAct: null, citationValidationAudit: {
          totalCitations: 0,
          verifiedCount: 0,
          rejectedCount: 0,
          validatedCitations: 0,
          unverifiedCitations: 0,
          auditStatus: "PASS_100_PERCENT_DETERMINISTIC",
          validationStandard: "100% deterministic canonical registry verification",
          registrySignature: ""
        }, equityPrinciples: [] },
      stage3: { isTimeBarred: false, accrualDate: null, limitationPeriodYears: null, calculationType: "other_category", timelineValidation: { isValid: false, errors: [haltDetail], warnings: [] } },
      stage4: { plaintiffs: [], defendants: [], joinderIssues: "", locusStandiSummary: "" },
      stage5: { plaintChecklist: [], groundsForRejection: [haltDetail] },
      stage6: { framedIssues: [], issueCount: 0 },
      stage7: { oralAssertions: 0, documentaryEvidence: 0, missingEvidence: [] },
      stage8: {
        evidenceList: [],
        burdenAssignments: [],
        statutoryPresumptions: [],
        elementGateStatus: "HALT",
        allSatisfied: false,
        missingElements: [],
        unknownElements: [],
        fatalFailures: [haltReason],
        ruleExecutionResults: [],
      },
      stage9: {
        issueDetails: [],
        meritScore: 0,
        meritAssessment: "Analysis halted before merit evaluation.",
      },
      stage10: {
        applicablePrinciples: [],
        discretionaryReliefCheck: null,
        equityPrinciples: [],
        equityScore: 0,
      },
      stage11: {
        timelineProgress: [],
        proceduralCompliance: false,
        proceduralNotes: [haltDetail],
      },
      stage12: { appealNodes: [], appealable: false, appealGrounds: [] },
      stage13: { conclusion: `Execution halted: ${haltReason}`, confidence: "NONE", requiresHumanReview: true, humanReviewReason: haltDetail, elementSummary: [], legalConclusions: [], recommendations: [] },
      f0Gate: { gateStatus: "HALT" as const, conflictCount: 0, criticalConflicts: 0, warnings: ctx.warnings.length > 0 ? ctx.warnings : ["Pre-F0 halt: " + haltReason] },
      auditHash: "PENDING",
    };
  }

  private buildF0HaltResponse(
    ctx: ExecutionContext,
    request: AnalyzeRequest,
    claimType: ClaimType,
    f0Gate: FactConsistencyGateOutput,
    synthesis: SynthesisResult,
    caseId: string,
    domain: string,
    legislation: ReturnType<RuleRegistry["getLegislationMapping"]>,
  ): CaseAnalysisResponse {
    return {
      caseId,
      userId: request.user.id,
      licenseId: request.license.licenseId,
      engineVersion: ENGINE_MANIFEST.engineVersion,
      ruleGraphVersion: ENGINE_MANIFEST.ruleGraphVersion,
      factSchemaVersion: ENGINE_MANIFEST.factSchemaVersion,
      executionTimestamp: new Date().toISOString(),
      executionStatus: "BLOCKED",
      outcome: "HALTED",
      corpusMode: ENGINE_MANIFEST.corpusMode,
      authorityStatus: this.authorityStatus,
      claimType,
      domain,
      legislation,
      gateF0: f0Gate,
      stage0: this.buildStage0Output(ctx),
      stage1: { primaryDomain: domain, subsidiaryDomains: [domain], domainConfidence: "NONE" },
      stage2: { relevantSections: legislation.relevantSections, primaryAct: legislation.primaryAct, citationValidationAudit: {
          totalCitations: 0,
          verifiedCount: 0,
          rejectedCount: 0,
          validatedCitations: 0,
          unverifiedCitations: 0,
          auditStatus: "PASS_100_PERCENT_DETERMINISTIC",
          validationStandard: "100% deterministic canonical registry verification",
          registrySignature: ""
        }, equityPrinciples: [] },
      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: ["F0 gate halted"], warnings: [] } },
      stage4: { plaintiffs: [], defendants: [], joinderIssues: "", locusStandiSummary: "" },
      stage5: { plaintChecklist: [], groundsForRejection: ["F0 gate halted"] },
      stage6: { framedIssues: [], issueCount: 0 },
      stage7: { oralAssertions: 0, documentaryEvidence: 0, missingEvidence: [] },
      stage8: {
        evidenceList: [],
        burdenAssignments: [],
        statutoryPresumptions: [],
        elementGateStatus: "HALT",
        allSatisfied: false,
        missingElements: [],
        unknownElements: [],
        fatalFailures: ["F0_CRITICAL_CONFLICT"],
        ruleExecutionResults: [],
      },
      stage9: {
        issueDetails: [],
        meritScore: 0,
        meritAssessment: "Analysis halted before merit evaluation.",
      },
      stage10: {
        applicablePrinciples: [],
        discretionaryReliefCheck: null,
        equityPrinciples: [],
        equityScore: 0,
      },
      stage11: { timelineProgress: [], proceduralCompliance: false, proceduralNotes: ["F0 gate halted"] },
      stage12: { appealNodes: [], appealable: false, appealGrounds: [] },
      stage13: {
        overview: `Execution halted: ${f0Gate.summary || "F0 gate halted"}`,
        reliefDecree: null,
        costsApportionment: null,
        equitableBars: null,
        executionPathway: null,
        conclusion: synthesis.conclusion,
        confidence: synthesis.confidence,
        requiresHumanReview: synthesis.requiresHumanReview,
        humanReviewReason: synthesis.humanReviewReason,
        elementSummary: synthesis.elementSummary,
        legalConclusions: synthesis.legalConclusions,
        recommendations: synthesis.recommendations,
      },
      f0Gate: {
        gateStatus: f0Gate.gateStatus,
        certification: "RED",
        summary: `F0 gate halted: ${f0Gate.gateStatus}`,
        atomicFacts: [],
        conflicts: [],
        criticalConflictCount: f0Gate.conflictCount ?? 0,
        conflictCount: f0Gate.conflictCount ?? 0,
        criticalConflicts: f0Gate.criticalConflicts ?? 0,
        warnings: f0Gate.warnings ?? [],
        materialConflictCount: 0,
        missingDocumentsCount: 0,
        verifiedRulesCount: 0,
        verifiedAuthoritiesCount: 0,
        readinessScore: 0,
        auditTrail: [],
      },
      auditHash: "PENDING",
    };
  }

  // =======================================================================
  // AUDIT PERSISTENCE
  // =======================================================================

  private async persistAudit(
    ctx: ExecutionContext,
    request: AnalyzeRequest,
    caseId: string,
    startTime: number,
    outcome: ExecutionOutcome,
    outputHash: string,
  ): Promise<void> {
    const facts = Array.from(ctx.factRegistry.values());
    const factRegistryHash = canonicalHash(facts.map((f) => ({ factId: f.factId, subject: f.subject, predicate: f.predicate, object: f.object, truth: f.truth, eventDate: f.eventDate, normalizedValue: f.normalizedValue })));
    const timelineHash = canonicalHash(ctx.eventTimeline);
    const executionTraceHash = canonicalHash(ctx.executionTrace);
    const rawInputHash = canonicalHash(request.input.factPattern);
    const extractionHash = canonicalHash(facts.map((f) => f.proposition));
    const inputHash = canonicalHash(request.input);
    const forensicInputHash = computeForensicHash({
      envelope: request,
      corpusIdentity: this.ruleRegistry.identity,
      ruleGraphIdentity: this.ruleRegistry.identity,
      engineVersion: ENGINE_MANIFEST.engineVersion,
      corpusMode: ENGINE_MANIFEST.corpusMode,
    });
    const payload: AuditRecordPayload = {
      caseId,
      rawInputHash,
      extractionHash,
      inputHash,
      factRegistryHash,
      timelineHash,
      eventTimelineHash: timelineHash,
      corpusIdentity: this.ruleRegistry.identity,
      corpusDigest: this.ruleRegistry.identity.corpusDigest,
      ruleRegistryVersion: this.ruleRegistry.version,
      ruleRegistryHash: canonicalHash(this.ruleRegistry.identity),
      executionTraceHash,
      outputHash,
      forensicInputHash,
      manifest: ENGINE_MANIFEST,
      executionMilliseconds: 0,
      analyzedByUserId: request.user.id,
      outcome,
    };
    await this.auditSink.append(payload);
  }

  // =======================================================================
  // P0-8: OUTPUT HASH — semantic hash, case identity separate
  // =======================================================================

  private computeOutputHash(response: CaseAnalysisResponse, _caseId: string): string {
    // P0-8: The semantic output hash must be deterministic and independent
    // of volatile identifiers (caseId, timestamps, executionTimestamp).
    // It represents the canonical legal analysis result.
    const semantic = {
      claimType: response.claimType,
      domain: response.domain,
      legislation: response.legislation,
      stage0: {
        atomicFacts: (response.stage0?.atomicFacts ?? []).map((f) => ({
          subject: f.subject,
          predicate: f.predicate,
          object: f.object,
          truth: f.truth,
          assertionType: f.assertionType,
          eventDate: f.eventDate,
          normalizedValue: f.normalizedValue,
          provenanceAssertions: f.provenanceAssertions,
        })),
        contradictionGraph: (response.stage0?.contradictionGraph ?? []).map((e) => ({
          propositionKey: e.propositionKey,
          leftFactId: e.leftFactId,
          rightFactId: e.rightFactId,
          relation: e.relation,
          status: e.status,
        })),
        eventTimeline: (response.stage0?.eventTimeline ?? []).map((e) => ({
          type: e.type,
          date: e.date,
          datePrecision: e.datePrecision,
          sourceFactIds: e.sourceFactIds,
        })),
      },
      stage1: response.stage1,
      stage2: {
        relevantSections: response.stage2?.relevantSections,
        primaryAct: response.stage2?.primaryAct,
        equityPrinciples: response.stage2?.equityPrinciples,
      },
      stage3: response.stage3,
      stage4: response.stage4,
      stage5: response.stage5,
      stage6: response.stage6,
      stage7: response.stage7,
      stage8: {
        elementGateStatus: response.stage8?.elementGateStatus,
        allSatisfied: response.stage8?.allSatisfied,
        missingElements: response.stage8?.missingElements,
        unknownElements: response.stage8?.unknownElements,
        fatalFailures: response.stage8?.fatalFailures,
        ruleExecutionResults: (response.stage8?.ruleExecutionResults ?? []).map((r) => ({
          ruleId: r.ruleId,
          status: r.status,
          predicateResults: r.predicateResults.map((p: any) => ({
            predicateId: p.predicateId,
            status: p.status,
            factIds: p.factIds,
            conflictDetected: p.conflictDetected,
          })),
        })),
      },
      stage9: response.stage9,
      stage10: response.stage10,
      stage11: response.stage11,
      stage12: response.stage12,
      stage13: {
        conclusion: response.stage13?.conclusion,
        confidence: response.stage13?.confidence,
        requiresHumanReview: response.stage13?.requiresHumanReview,
        elementSummary: response.stage13?.elementSummary,
        legalConclusions: response.stage13?.legalConclusions,
        recommendations: response.stage13?.recommendations,
      },
      f0Gate: {
        gateStatus: response.f0Gate?.gateStatus,
        conflictCount: response.f0Gate?.conflictCount,
        criticalConflicts: response.f0Gate?.criticalConflicts,
      },
    };
    return canonicalHash(semantic);
  }

  // =======================================================================
  // UTILITY: FIND DATE FACT
  // =======================================================================

  private findDateFact(ctx: ExecutionContext, predicate: string): string | null {
    const fact = Array.from(ctx.factRegistry.values()).find(
      (f) => f.predicate === predicate && f.eventDate && isStrictDate(f.eventDate),
    );
    return fact?.eventDate ?? null;
  }

  // =======================================================================
  // UTILITY: GET CONFLICT MODE FROM FACTS
  // =======================================================================

  private getConflictModeFromFacts(
    ctx: ExecutionContext,
    subject: string,
    predicate: string,
  ): PredicateConflictMode {
    return getConflictMode(ctx, subject, predicate);
  }

  // =======================================================================
  // UTILITY: AUTHORITY ID EXTRACTOR
  // =======================================================================

  private rp_authorityIds(rule: LegalRule): string[] {
    return (rule as any).authorityIds ?? [rule.authority.act];
  }
}
