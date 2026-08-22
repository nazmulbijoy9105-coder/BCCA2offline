// src/engine/BCCAAEngine.ts
// BCCAA 4.5.1-Hardened — Complete Implementation
//
// Design target:
//   FACT -> PROPOSITION -> ASSERTION -> VALIDATION -> RULE PREDICATE
//   -> LOGICAL OPERATOR -> RULE RESULT -> LEGAL CONCLUSION -> AUDIT
//
// All 10 critical fixes applied. All methods implemented. No truncation.

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
  engineVersion: "4.5.1-Hardened",
  factSchemaVersion: "4.0.0",
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

export type LegalEventType =
  | "ANCESTOR_DEATH"
  | "AGREEMENT_EXECUTION"
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

/** ISSUE 5-6: Expanded outcome enum — element-only execution must not produce SUCCESS. */
export type ExecutionOutcome =
  | "SUCCESS"
  | "STRUCTURAL_ONLY"
  | "PARTIAL"
  | "INDETERMINATE"
  | "HALTED"
  | "ERROR";

/** ISSUE 5: Pipeline-level execution status distinguishes BLOCKED from NOT_EXECUTED. */
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
}

export type FactSource = SourceSpan;

export interface Proposition {
  propositionId: string;
  subject: string;
  predicate: string;
  object: string | null;
  canonicalKey: string;
  text: string;
  /** ISSUE 4: Conflict mode for this proposition family. */
  conflictMode: PredicateConflictMode;
}

/**
 * ISSUE 12 (from review): Assertion no longer carries truth field.
 * Truth is a property of the VALIDATED FACT, not the assertion.
 */
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
  /** Truth lives HERE, not on Assertion. */
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
// AUTHORITY / RULE GRAPH
// ============================================================================

export interface AuthorityRef {
  authorityId?: string;
  act: string;
  section: string;
  citation?: string;
}

/**
 * ISSUE 13-14 (from review): Per-predicate provenance requirements.
 * Each predicate can specify exact validation thresholds for each provenance dimension.
 * Replaces coarse requireVerified: boolean.
 */
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
  /** DEPRECATED: Use validationRequirements instead. Kept for backwards compatibility. */
  requireVerified?: boolean;
  /** ISSUE 13-14: Richer per-predicate provenance thresholds. */
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

/**
 * ISSUE 7: authorityStatus is an EXPLICIT property,
 * NOT derived from string inspection of corpusDigest.
 */
export interface RuleRegistry {
  version: string;
  identity: RuleGraphIdentity;
  authorityStatus: "VALIDATED_PRODUCTION" | "DEVELOPMENT_FIXTURE";
  getClaimElements(claimType: ClaimType, jurisdiction: string): LegalRule[];
  getLegislationMapping(claimType: ClaimType): {
    primaryAct: string;
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
  /** ISSUE 3: Same-family conflicting facts hidden by object filter. */
  conflictDetected?: boolean;
  /** ISSUE 3: Details of same-family conflicts hidden by object filter. */
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

/** ISSUE 2/6: Rich fact evaluation result passed into F0, not collapsed to boolean. */
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
  /** ISSUE 4: Predicate conflict mode registry. */
  predicateConflictModes: Map<string, PredicateConflictMode>;
}

/** Common return type for all P1 stage methods. */
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

/**
 * ISSUE 4: Each predicate family has an explicit conflict mode.
 * No more treating all same-subject-predicate as automatically contradictory.
 */
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
  // Wildcard match: *|PREDICATE|*
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

/** ISSUE 9: Explicit hash input for forensic reproducibility. */
export interface ForensicHashInput {
  envelope: unknown;
  corpusIdentity: RuleGraphIdentity;
  ruleGraphIdentity: RuleGraphIdentity;
  engineVersion: string;
  corpusMode: string;
}

/** ISSUE 9: Binds execution environment into forensic hash. */
export function computeForensicHash(input: ForensicHashInput): string {
  return canonicalHash(input);
}

/** ISSUE 9: Capability interface for production audit sinks. */
export interface ValidatedAuditSink extends AuditSink {
  readonly atomicAppend: true;
  readonly durable: true;
  readonly concurrencySafe: true;
}

// ============================================================================
// AUDIT / LICENSE INTERFACES
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
  /** ISSUE 9: Execution environment binding for forensic reproducibility. */
  forensicInputHash: string;
  manifest: typeof ENGINE_MANIFEST;
  executionMilliseconds: number;
  analyzedByUserId: string;
  /** ISSUE 5-6: Expanded outcome enum. */
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
}

// ============================================================================
// FIX #1 & #2: EXPLICIT ADMISSIBILITY SETS (no ordinal comparison)
// ============================================================================

/**
 * Each cell defines: "which actual statuses SATISFY this requirement level?"
 * No ordinal arithmetic. No cross-enum comparison. Fully explicit.
 *
 * FIX #1: SourceStatus and ExtractionStatus are never compared against each other.
 * FIX #2: No ordinal ordering — each admissibility decision is a set membership check.
 */

const EXTRACTION_SATISFIES: Record<boolean, ReadonlySet<ExtractionStatus>> = {
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

/**
 * FIX #1 & #2: Explicit admissibility semantics.
 * Each dimension is checked independently via set membership.
 * No ordinal positions. No cross-enum comparison.
 */
function meetsValidationRequirements(
  fact: AtomicFact,
  req: ValidationRequirements,
): boolean {
  // Extraction: boolean gate
  if (!EXTRACTION_SATISFIES[req.extractionRequired].has(fact.validation.extractionStatus)) {
    return false;
  }
  // Source: enum-to-enum set check
  if (!SOURCE_SATISFIES[req.sourceRequired].has(fact.validation.sourceStatus)) {
    return false;
  }
  // Authentication: enum-to-enum set check
  if (!AUTH_SATISFIES[req.authenticationRequired].has(fact.validation.authenticationStatus)) {
    return false;
  }
  // Corroboration: enum-to-enum set check (CONTRADICTED does NOT satisfy CORROBORATED)
  if (!CORR_SATISFIES[req.corroborationRequired].has(fact.validation.corroborationStatus)) {
    return false;
  }
  // Human validation: enum-to-enum set check
  if (!HV_SATISFIES[req.humanValidationRequired].has(fact.validation.humanValidationStatus)) {
    return false;
  }
  return true;
}

// ============================================================================
// DEVELOPMENT IMPLEMENTATIONS — MODULE SCOPE (not nested inside classes)
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
  /** ISSUE 10: Explicit fixture marker — never confused with production. */
  authorityStatus = "DEVELOPMENT_FIXTURE" as const;

  getClaimElements(claimType: ClaimType, jurisdiction: string): LegalRule[] {
    if (claimType === "SPECIFIC_PERFORMANCE") {
      return [
        {
          ruleId: "SP-ELEMENT-REGISTRATION",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1900-01-01",
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
          authority: {
            act: "Applicable specific-performance law",
            section: "Registry-controlled",
          },
          priority: 1,
        },
        {
          ruleId: "SP-ELEMENT-DEPOSIT",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1900-01-01",
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
          authority: {
            act: "Applicable specific-performance law",
            section: "Registry-controlled",
          },
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
          effectiveFrom: "1900-01-01",
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
          authority: {
            act: "Applicable succession law",
            section: "Registry-controlled",
          },
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
          effectiveFrom: "1900-01-01",
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
          authority: {
            act: "Transfer of Property Act 1882",
            section: "Section 54",
          },
          priority: 1,
        },
        {
          ruleId: "DP-ELEMENT-POSSESSION",
          ruleVersion: "1.0.0",
          jurisdiction,
          effectiveFrom: "1900-01-01",
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
          authority: {
            act: "Specific Relief Act 1877",
            section: "Section 8",
          },
          priority: 2,
        },
      ];
    }
    return [];
  }

  getLegislationMapping(claimType: ClaimType) {
    if (
      claimType === "SPECIFIC_PERFORMANCE" ||
      claimType === "DECLARATION_AND_POSSESSION"
    ) {
      return {
        primaryAct: "Specific Relief Act 1877",
        relevantSections: [
          {
            actName: "Specific Relief Act 1877",
            sectionOrRule: "Sections 8-12, 21A",
            purpose: "Claim-specific analysis",
          },
        ],
      };
    }
    if (claimType === "INHERITANCE_CONSULTATION")
      return {
        primaryAct: "Applicable succession / personal law",
        relevantSections: [],
      };
    return { primaryAct: "N/A", relevantSections: [] };
  }
}

/** @deprecated Fixture alias retained only for source compatibility. */
export class DefaultRuleRegistry extends DevelopmentRuleRegistry {
  constructor() {
    super();
    console.warn(
      "[DefaultRuleRegistry] Deprecated fixture alias; not validated law.",
    );
  }
}

export class DefaultAuditSink implements AuditSink {
  readonly isProductionReady = false;
  private lastRecord: AuditRecord | null = null;
  async append(payload: AuditRecordPayload): Promise<AuditRecord> {
    const previousHash = this.lastRecord?.recordHash ?? null;
    const recordHash = canonicalHash({ payload, previousHash });
    const record = { ...payload, previousHash, recordHash };
    this.lastRecord = record;
    console.warn(
      "[DefaultAuditSink] Development-only, non-durable, non-atomic audit sink.",
    );
    return record;
  }
}

export class DefaultLicenseValidator implements LicenseValidator {
  readonly isProductionReady = false;
  async validate(
    _user: AuthUser,
    license: { licenseId: string; issuedTo: string },
  ) {
    if (!license?.licenseId || !license?.issuedTo)
      return { valid: false, reason: "License object incomplete." };
    return { valid: true };
  }
}

export class NoOpFactValidationProvider implements FactValidationProvider {
  readonly isProductionReady = false;
  async validateFacts({
    facts,
  }: {
    facts: AtomicFact[];
    propositions: Proposition[];
    assertions: Assertion[];
  }) {
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
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
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

/** Backwards-compatible: now accepts "18 July 2018" */
function isStrictDate(raw: string): boolean {
  return parseNaturalDate(raw) !== null;
}

/** Backwards-compatible timestamp extractor */
function strictDateTimestamp(raw: string | null): number {
  return raw ? (parseNaturalDate(raw)?.ts ?? Infinity) : Infinity;
}

/** Normalize any recognized date to ISO-8601 */
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

/** Generate a short deterministic ID for internal use. */
function shortId(prefix: string, counter: number): string {
  return `${prefix}${String(counter).padStart(5, "0")}`;
}

// ============================================================================
// FACT CANDIDATE INTERFACE (extraction helper)
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
    this.ruleRegistry = deps?.ruleRegistry ?? new DevelopmentRuleRegistry();
    this.auditSink = deps?.auditSink ?? new DefaultAuditSink();
    this.licenseValidator =
      deps?.licenseValidator ?? new DefaultLicenseValidator();
    this.factValidationProvider =
      deps?.factValidationProvider ?? new NoOpFactValidationProvider();

    // FIX: Broken ternary → proper nullish coalescing chain
    this.authorityStatus =
      deps?.ruleRegistry?.authorityStatus ??
      this.ruleRegistry.authorityStatus ??
      "DEVELOPMENT_FIXTURE";

    // ISSUE 7: EXPLICIT authority status check, not derived from string prefix
    if (ENGINE_MANIFEST.corpusMode === "VALIDATED_PRODUCTION") {
      if (this.authorityStatus !== "VALIDATED_PRODUCTION") {
        throw new Error(
          "FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires ruleRegistry.authorityStatus === 'VALIDATED_PRODUCTION'.",
        );
      }

      // FIX #4: Validate ValidatedAuditSink CAPABILITIES, not instanceof
      const sink = this.auditSink as Record<string, unknown>;
      if (
        sink.atomicAppend !== true ||
        sink.durable !== true ||
        sink.concurrencySafe !== true
      ) {
        throw new Error(
          "FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a ValidatedAuditSink with atomicAppend=true, durable=true, concurrencySafe=true.",
        );
      }

      // ISSUE 7: Check that production validator is not NoOp
      if (this.factValidationProvider instanceof NoOpFactValidationProvider) {
        throw new Error(
          "FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a production FactValidationProvider.",
        );
      }
    }
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  async analyze(request: AnalyzeRequest): Promise<CaseAnalysisResponse> {
    const startTime = Date.now();
    const caseId = `BCCAA-4.5-${Date.now()}-${generateSecureId().slice(0, 8)}`;
    const ctx = newContext();

    try {
      const license = await this.licenseValidator.validate(
        request.user,
        request.license,
      );
      if (!license.valid) {
        recordTrace(ctx, {
          layer: "P0_INPUT_VALIDATION",
          description: `LICENSE_DENIED: ${license.reason ?? "unspecified"}`,
          dependsOnFacts: [],
          dependsOnRules: [],
          result: "REJECTED",
        });
        return this.buildPreF0HaltResponse(
          ctx,
          caseId,
          "LICENSE_DENIED",
          license.reason ?? "unspecified",
        );
      }
      if (!request.input?.factPattern) {
        recordTrace(ctx, {
          layer: "P0_INPUT_VALIDATION",
          description: "EMPTY_INPUT: factPattern is required.",
          dependsOnFacts: [],
          dependsOnRules: [],
          result: "REJECTED",
        });
        return this.buildPreF0HaltResponse(
          ctx,
          caseId,
          "EMPTY_INPUT",
          "factPattern is required.",
        );
      }
      if (request.input.factPattern.length > MAX_INPUT_LENGTH) {
        recordTrace(ctx, {
          layer: "P0_INPUT_VALIDATION",
          description: `INPUT_TOO_LARGE: maximum ${MAX_INPUT_LENGTH} characters.`,
          dependsOnFacts: [],
          dependsOnRules: [],
          result: "REJECTED",
        });
        return this.buildPreF0HaltResponse(
          ctx,
          caseId,
          "INPUT_TOO_LARGE",
          `maximum ${MAX_INPUT_LENGTH} characters.`,
        );
      }
      return await this.runPipeline(ctx, request, caseId, startTime);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      recordTrace(ctx, {
        layer: "SYSTEM_ERROR",
        description: "Uncaught execution error.",
        dependsOnFacts: [],
        dependsOnRules: [],
        result: message,
      });
      const response = this.buildPreF0HaltResponse(
        ctx,
        caseId,
        "SYSTEM_ERROR",
        message,
      );
      await this.persistAudit(
        ctx,
        request,
        caseId,
        startTime,
        "ERROR",
        this.computeOutputHash(response),
      ).catch(() => undefined);
      return response;
    }
  }

  // ========================================================================
  // PIPELINE ORCHESTRATION
  // ========================================================================

  private async runPipeline(
    ctx: ExecutionContext,
    request: AnalyzeRequest,
    caseId: string,
    startTime: number,
  ): Promise<CaseAnalysisResponse> {
    const { input } = request;
    const claimType = this.resolveClaimType(
      input.factPattern,
      input.focusDomain,
    );

    // ── P0: FACT → PROPOSITION → ASSERTION → VALIDATION ──
    this.extractAtomicFacts(ctx, input.factPattern, claimType);
    await this.applyFactValidation(ctx);
    this.buildContradictionGraph(ctx);
    this.buildEventTimeline(ctx);

    // ── ISSUE 1: logCriticalConflicts NEVER throws — data only ──
    this.logCriticalConflicts(ctx);

    // ── F0 GATE: sole authority ──
    // FIX #3: requireVerified: true means VERIFIED, not IDENTIFIED
    // FIX #6: Pass FULL ancestorResult object into F0, not boolean collapse
    const ancestorResult = this.evaluateFact(ctx, "Ancestor", "Vital Status", "DECEASED", {
      requireVerified: true,
      // No object filter — check full proposition family
    });

    const chronology = ctx.eventTimeline.map((e) => ({
      date: e.date ?? "UNKNOWN",
      event: e.type,
      partiesInvolved: "",
      factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
      // FIX #6: Full conflict state passed via chronology
      conflictInfo:
        ctx.contradictionGraph.length > 0
          ? {
              total: ctx.contradictionGraph.length,
              critical: ctx.contradictionGraph.filter(
                (edge) => edge.status === "CRITICAL",
              ).length,
              edges: ctx.contradictionGraph.map((edge) => ({
                propositionKey: edge.propositionKey,
                leftFactId: edge.leftFactId,
                rightFactId: edge.rightFactId,
                status: edge.status,
              })),
            }
          : undefined,
    }));

    // FIX #6: Pass full ancestorResult object, not boolean
    const f0Gate = FactConsistencyGate.evaluate(
      input.factPattern,
      chronology,
      claimType,
      ancestorResult,
    );

    recordTrace(ctx, {
      layer: "F0_GATE",
      description:
        "FactConsistencyGate executed (sole F0 authority)." +
        `ancestorDeceased (verified only): ${ancestorResult.status}. ` +
        `Supporting: [${ancestorResult.supportingFactIds.join(", ")}]. ` +
        `Conflict detected: ${ancestorResult.conflictDetected}. ` +
        (ctx.contradictionGraph.length > 0
          ? `CRITICAL_EDGES_REPORTED: ${ctx.contradictionGraph.filter((e) => e.status === "CRITICAL").length}.`
          : ""),
      dependsOnFacts: getAllFactIds(ctx),
      dependsOnRules: [],
      result: f0Gate.gateStatus,
    });

    if (f0Gate.gateStatus === "HALT_CRITICAL_CONFLICT") {
      const emptyGate: ElementGateResult = {
        status: GateStatus.HALT,
        allSatisfied: false,
        missingElements: [],
        unknownElements: [],
        fatalFailures: ["F0_CRITICAL_CONFLICT"],
        ruleExecutionResults: [],
      };
      const synthesis = this.executeFailClosedSynthesis(
        ctx,
        f0Gate,
        claimType,
        emptyGate,
      );
      const response = this.buildF0HaltResponse(
        ctx,
        request,
        claimType,
        f0Gate,
        synthesis,
        caseId,
      );
      await this.persistAudit(
        ctx,
        request,
        caseId,
        startTime,
        "HALTED",
        this.computeOutputHash(response),
      );
      return response;
    }

    // ── P1 stages ──
    const domain = this.classifyDomain(ctx, claimType);
    const legislation = this.mapLegislation(ctx, claimType);
    const limitation = this.executeLimitationEngine(ctx, claimType);
    const elementGate = this.executeElementCompletenessGate(ctx, claimType);

    // ISSUE 5-8: Each stage inspects upstream state, distinguishes BLOCKED
    const standi = this.executePartyStandiRules(ctx, claimType);
    const pleading = this.executePleadingRules(elementGate);
    const issues = this.executeIssueFramingRules(ctx, elementGate);
    const evidence = this.executeEvidenceRules(ctx);
    const merits = this.executeMeritRules(elementGate); // ISSUE 12: always NOT_EXECUTED
    const equity = this.executeEquityRules(elementGate);
    const procedure = this.executeProcedureRules(ctx, claimType);
    const appeal = this.executeAppealRules();

    // ── P2: SYNTHESIS ──
    const synthesis = this.executeFailClosedSynthesis(
      ctx,
      f0Gate,
      claimType,
      elementGate,
    );

    // ISSUE 5-6: Determine execution status and outcome
    const executionStatus = this.determineExecutionStatus(
      standi,
      pleading,
      issues,
      evidence,
      merits,
      equity,
      procedure,
      appeal,
    );
    const outcome = this.determineOutcome(executionStatus, elementGate);

    const response = this.buildResponse(
      ctx,
      request,
      claimType,
      f0Gate,
      synthesis,
      {
        caseId,
        domain,
        legislation,
        limitation,
        standi,
        pleading,
        issues,
        evidence,
        elementGate,
        merits,
        equity,
        procedure,
        appeal,
        executionStatus,
      },
    );
    await this.persistAudit(
      ctx,
      request,
      caseId,
      startTime,
      outcome,
      this.computeOutputHash(response),
    );
    return response;
  }

  // ========================================================================
  // P0 EXTRACTION
  // ========================================================================

  private extractAtomicFacts(
    ctx: ExecutionContext,
    rawText: string,
    claimType: ClaimType,
  ): void {
    const sentences = this.segmentDocument(rawText);
    for (let index = 0; index < sentences.length; index++) {
      const sentence = sentences[index];
      for (const clause of this.segmentClauses(sentence)) {
        const candidates = this.extractClauseFacts(clause);
        if (!candidates.length) continue;

        const assertionContext = this.detectAssertionContext(clause);
        const assertedBy = this.detectAssertingParty(clause);

        for (const candidate of candidates) {
          const propositionId = this.ensureProposition(
            ctx,
            candidate.subject,
            candidate.predicate,
            candidate.object,
            clause,
          );

          const assertionId = shortId("A", ctx.assertionCounter++);
          const source: SourceSpan = {
            documentId: "INPUT_NARRATIVE",
            segment: clause,
            paragraph: index + 1,
            sourceType: "INPUT_NARRATIVE",
            extractionMethod: "PATTERN",
          };

          // ISSUE 12: No truth on Assertion — lives on Fact only
          ctx.assertionRegistry.set(assertionId, {
            assertionId,
            propositionId,
            assertionType: assertionContext.type,
            polarity: assertionContext.polarity,
            assertedBy: assertedBy ?? undefined,
            sourceSpan: source,
          });

          const factId = shortId("F", ctx.factCounter++);
          const fact: AtomicFact = {
            factId,
            propositionId,
            assertionId,
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
            disputedProposition:
              assertionContext.type === AssertionType.DENIED ||
              assertionContext.polarity === AssertionPolarity.DISPUTED
                ? clause
                : undefined,
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
            dependsOnFacts: [],
            dependsOnRules: [],
            result: `${factId}:${propositionId}:${assertionId}`,
          });
        }
      }
    }
    this.ensureClaimRelevantUnknowns(ctx, claimType);
  }

  private ensureProposition(
    ctx: ExecutionContext,
    subject: string,
    predicate: string,
    object: string | null,
    text: string,
  ): string {
    const canonicalKey = `${subject}|${predicate}|${object ?? "*"}`.toUpperCase();
    const existing = Array.from(ctx.propositionRegistry.values()).find(
      (p) => p.canonicalKey === canonicalKey,
    );
    if (existing) return existing.propositionId;
    const propositionId = shortId("P", ctx.propositionCounter++);
    ctx.propositionRegistry.set(propositionId, {
      propositionId,
      subject,
      predicate,
      object,
      canonicalKey,
      text,
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
      throw new Error(
        "FACT_VALIDATION_INTEGRITY_ERROR: validator changed fact cardinality.",
      );
    }
    for (const fact of validated) {
      const original = ctx.factRegistry.get(fact.factId);
      if (!original) {
        throw new Error(
          `FACT_VALIDATION_INTEGRITY_ERROR: unknown fact ${fact.factId}.`,
        );
      }

      // ISSUE 7: Identity check — reject mutations to immutable fields
      if (
        fact.subject !== original.subject ||
        fact.predicate !== original.predicate ||
        fact.object !== original.object ||
        fact.assertionId !== original.assertionId ||
        fact.propositionId !== original.propositionId
      ) {
        throw new Error(
          `FACT_VALIDATION_INTEGRITY_ERROR: fact ${fact.factId} identity mutated by validator.`,
        );
      }

      // FIX #7-EXTENDED: Block ANY truth mutation from UNKNOWN (both TRUE and FALSE)
      if (
        original.truth === Tristate.UNKNOWN &&
        fact.truth !== Tristate.UNKNOWN
      ) {
        throw new Error(
          `FACT_VALIDATION_INTEGRITY_ERROR: fact ${fact.factId} truth silently mutated from UNKNOWN to ${fact.truth} by validator. Truth can only be set by rule evaluation, not validation.`,
        );
      }

      ctx.factRegistry.set(fact.factId, fact);
    }
  }

  // ========================================================================
  // P0 HELPERS: SEGMENTATION
  // ========================================================================

  private segmentDocument(rawText: string): string[] {
    let text = rawText.replace(/\r\n/g, "\n");

    // ── Protect abbreviation periods from being treated as sentence ends ──
    const abbreviations = [
      "Mr", "Mrs", "Ms", "Dr", "vs", "v", "BDT", "Tk", "Taka", "taka",
      "No", "Art", "Sec", "Ord", "SRA", "CPC", "St", "Lt", "Col", "Gen",
      "Prof", "Hon", "Jr", "Sr", "ALR", "BLD", "BLC", "DLR", "MLR",
      "AD", "SC", "HC", "Vol", "pp", "etc", "i.e", "e.g",
    ];

    const protectedMarks: string[] = [];
    for (const abbr of abbreviations) {
      const regex = new RegExp(`\\b${abbr}\\.`, "gi");
      text = text.replace(regex, (match) => {
        const mark = `\x00P${protectedMarks.length}\x00`;
        protectedMarks.push(match);
        return mark;
      });
    }

    // ── Also protect decimal numbers like "8,000,000." ──
    text = text.replace(/(\d[\d,]*)\./g, (_match, num: string) => {
      const mark = `\x00P${protectedMarks.length}\x00`;
      protectedMarks.push(`${num}.`);
      return mark;
    });

    // Split on sentence-ending punctuation followed by whitespace or end
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Restore all protected marks
    return sentences.map((s) => {
      let result = s;
      for (let i = protectedMarks.length - 1; i >= 0; i--) {
        result = result.replace(`\x00P${i}\x00`, protectedMarks[i]);
      }
      return result;
    });
  }

  private segmentClauses(sentence: string): string[] {
    return sentence
      .split(
        /\s*(?:;|\bbut\b|\balthough\b|\bhowever\b|\bwhereas\b|\bwhile\b)\s*/i,
      )
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // ========================================================================
  // P0 HELPERS: FACT EXTRACTION
  // ========================================================================

  private extractClauseFacts(clause: string): FactCandidate[] {
    const candidates: FactCandidate[] = [];
    const lower = clause.toLowerCase();

    // ── DEATH: allow up to 6 intervening words (e.g. "died intestate on ...") ──
    const deathMatch = clause.match(
      /(?:died|passed away|demise|death of|expired)(?:\s+\w+){0,6}?\s+(?:on\s+)?([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,},?\s*[0-9]{4}|[A-Za-z]{3,}\s+[0-9]{1,2},?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    );
    if (deathMatch) {
      candidates.push({
        subject: "Ancestor",
        predicate: "Vital Status",
        object: "DECEASED",
        eventDate: normalizeDate(deathMatch[1].trim()),
      });
    } else if (/\b(?:died|passed away|demise|death of|expired)\b/i.test(lower)) {
      candidates.push({
        subject: "Ancestor",
        predicate: "Vital Status",
        object: "DECEASED",
      });
    }

    // ── LIVING ANCESTOR ──
    if (/\b(?:father is alive|living father|during his lifetime|ancestor is living)\b/i.test(lower)) {
      candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "ALIVE" });
    }

    // ── INTESTATE ──
    if (/\bintestate\b/i.test(lower)) {
      candidates.push({ subject: "Ancestor", predicate: "Succession Type", object: "INTESTATE" });
    }

    // ── REGISTRATION STATUS ──
    if (/\b(?:unregistered)\s+(?:bainapatra|agreement|contract)\b/i.test(lower)) {
      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "UNREGISTERED" });
    } else if (/\b(?:registered)\s+(?:bainapatra|agreement|contract)\b/i.test(lower)) {
      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "REGISTERED" });
    } else if (/\b(?:bainapatra|agreement for sale|sale agreement)\b/i.test(lower)) {
      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: null });
    }

    // ── DEPOSIT STATUS ──
    if (/\b(?:deposited|deposit)\s+(?:the\s+)?(?:balance|remaining|money|amount)\b/i.test(lower) ||
        /\btreasury\s+(?:challan|deposit)\b/i.test(lower)) {
      const amountMatch = clause.match(/(?:tk\.?|taka|bd\s*taka)\s*([\d,]+(?:\.\d+)?)/i);
      candidates.push({
        subject: "Treasury Deposit",
        predicate: "Payment Status",
        object: "DEPOSITED",
        normalizedValue: amountMatch ? parseMoney(amountMatch[1]) : null,
      });
    } else if (/\b(?:not\s+deposited|no\s+deposit|failed\s+to\s+deposit)\b/i.test(lower)) {
      candidates.push({ subject: "Treasury Deposit", predicate: "Payment Status", object: "NOT_DEPOSITED" });
    }

    // ── POSSESSION / DISPOSSESSION ──
    if (/\b(?:dispossessed|ousted|ouster|fence|encroached|trespass)\b/i.test(lower) ||
        /\bdenied\s+(?:the\s+)?(?:plaintiff|co[-\s]?sharers?)\s+access\b/i.test(lower) ||
        /\bprevented\s+(?:the\s+)?(?:plaintiff|co[-\s]?sharers?)\s+from\s+entering\b/i.test(lower)) {
      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "DISPOSSESSED" });
    }
    if (/\b(?:in\s+(?:peaceful|continuous)\s+possession|possessing)\b/i.test(lower)) {
      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "IN_POSSESSION" });
    }

    // ── AGREEMENT / SALE DEED EXECUTION DATE ──
    const agreeDateMatch = clause.match(
      /(?:agreement|bainapatra|contract|sale deed)\s+(?:executed|made|signed|registration|finalized|upon)\s+(?:on\s+)?([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,},?\s*[0-9]{4}|[A-Za-z]{3,}\s+[0-9]{1,2},?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    );
    if (agreeDateMatch) {
      const nd = normalizeDate(agreeDateMatch[1].trim());
      candidates.push({ subject: "Bainapatra", predicate: "Execution Date", object: nd, eventDate: nd });
    }

    // ── DEMAND / REFUSAL / PARTITION DATE ──
    const demandMatch = clause.match(
      /(?:demanded|demand|refused|refusal|denied)\b.*?\s+(?:on\s+)?([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,},?\s*[0-9]{4}|[A-Za-z]{3,}\s+[0-9]{1,2},?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    );
    if (demandMatch) {
      const nd = normalizeDate(demandMatch[1].trim());
      candidates.push({ subject: "Defendant", predicate: "Refusal Date", object: nd, eventDate: nd });
    }

    // ── DEMAND DATE (explicit "demanded ... on DATE") ──
    const demandDateMatch = clause.match(
      /(?:demanded|demand)\s+(?:on\s+)?([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,},?\s*[0-9]{4}|[A-Za-z]{3,}\s+[0-9]{1,2},?\s*[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    );
    if (demandDateMatch) {
      const nd = normalizeDate(demandDateMatch[1].trim());
      candidates.push({ subject: "Plaintiff", predicate: "Demand Date", object: nd, eventDate: nd });
    }

    // ── TITLE STATUS ──
    if (/\b(?:registered\s+(?:owner|title|kabala|sale\s+deed))\b/i.test(lower)) {
      candidates.push({ subject: "Plaintiff", predicate: "Title Status", object: "REGISTERED_OWNER" });
    }

    // ── DISOWNING ──
    if (/\b(?:disown|disowned|disowning)\b/i.test(lower)) {
      candidates.push({ subject: "Ancestor", predicate: "Disowning Declaration", object: "DECLARED" });
    }

    // ── MUTATION ──
    if (/\b(?:mutation|namjari|khatian)\b/i.test(lower)) {
      if (/\b(?:exclusive|solely\s+in\s+the\s+name\s+of)\b/i.test(lower)) {
        candidates.push({ subject: "Property", predicate: "Mutation Status", object: "EXCLUSIVE_MUTATION" });
      } else {
        candidates.push({ subject: "Property", predicate: "Mutation Status", object: "MUTATED" });
      }
    }

    // ── UNAUTHORIZED CONSTRUCTION ──
    if (/\b(?:unauthorized\s+construction|constructing\s+without)\b/i.test(lower)) {
      candidates.push({ subject: "Defendant", predicate: "Construction Status", object: "UNAUTHORIZED" });
    }

    // ── CO-SHARER / JOINT OWNERSHIP ──
    if (/\b(?:co-?sharers?|joint\s+owner|joint\s+ownership|jointly\s+owned)\b/i.test(lower)) {
      candidates.push({ subject: "Property", predicate: "Ownership Structure", object: "JOINT" });
    }

    // ── MONETARY AMOUNTS ──
    const moneyMatches = clause.matchAll(
      /(?:tk\.?|taka|bd\s*taka|bdt)\s*([\d,]+(?:\.\d+)?)/gi,
    );
    for (const mm of moneyMatches) {
      const val = parseMoney(mm[1]);
      if (val !== null) {
        candidates.push({ subject: "Claim", predicate: "Quantum Amount", object: mm[0].trim(), normalizedValue: val });
      }
    }

    return candidates;
  }

  private detectAssertionContext(
    clause: string,
  ): { type: AssertionType; polarity: AssertionPolarity } {
    if (
      /\b(defendant|plaintiff)\b[^.!?]{0,80}\b(?:denies?|disputes?|refutes?)\b/i.test(clause) ||
      /\b(?:denies?|disputes?|refutes?)\b[^.!?]{0,80}\b(defendant|plaintiff)\b/i.test(clause)
    ) {
      return { type: AssertionType.DENIED, polarity: AssertionPolarity.DISPUTED };
    }
    if (
      /\b(?:admits?|admitted|concedes?|conceded|acknowledges?)\b/i.test(clause)
    ) {
      return { type: AssertionType.ADMITTED, polarity: AssertionPolarity.POSITIVE };
    }
    if (
      /\b(?:it is the|this is the)\s+(?:plaintiff's|defendant's)\s+case\b/i.test(
        clause,
      ) ||
      /\b(?:plaintiff|defendant)\b[^.!?]{0,60}\b(?:case\s+is|contends?|submits?|claims?)\b/i.test(
        clause,
      )
    ) {
      return { type: AssertionType.ASSERTED, polarity: AssertionPolarity.POSITIVE };
    }
    if (/\b(?:according to|stated by|deposed by)\b/i.test(clause)) {
      return { type: AssertionType.PARTY_NARRATIVE, polarity: AssertionPolarity.POSITIVE };
    }
    if (/\b(?:court\s+found|held\s+that|decided\s+that)\b/i.test(clause)) {
      return {
        type: AssertionType.COURT_FINDING,
        polarity: AssertionPolarity.POSITIVE,
      };
    }
    if (/\b(?:document\s+shows|record\s+reveals|registered\s+deed)\b/i.test(clause)) {
      return {
        type: AssertionType.DOCUMENTARY_FACT,
        polarity: AssertionPolarity.POSITIVE,
      };
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

  // ========================================================================
  // P0 HELPERS: ENSURE CLAIM-RELEVANT UNKNOWNS
  // ========================================================================

  private ensureClaimRelevantUnknowns(
    ctx: ExecutionContext,
    claimType: ClaimType,
  ): void {
    const existingKeys = new Set(
      Array.from(ctx.factRegistry.values()).map(
        (f) => `${f.subject}|${f.predicate}`.toUpperCase(),
      ),
    );

    const requiredPairs: Array<[string, string]> = [];

    if (claimType === "SPECIFIC_PERFORMANCE") {
      requiredPairs.push(["Bainapatra", "Registration Status"]);
      requiredPairs.push(["Treasury Deposit", "Payment Status"]);
      requiredPairs.push(["Bainapatra", "Execution Date"]);
    } else if (claimType === "DECLARATION_AND_POSSESSION") {
      requiredPairs.push(["Plaintiff", "Title Status"]);
      requiredPairs.push(["Plaintiff", "Possession Status"]);
    } else if (claimType === "INHERITANCE_CONSULTATION") {
      requiredPairs.push(["Ancestor", "Vital Status"]);
      requiredPairs.push(["Ancestor", "Succession Type"]);
      requiredPairs.push(["Property", "Ownership Structure"]);
      requiredPairs.push(["Property", "Mutation Status"]);
    }

    for (const [subject, predicate] of requiredPairs) {
      const key = `${subject}|${predicate}`.toUpperCase();
      if (!existingKeys.has(key)) {
        const propositionId = this.ensureProposition(
          ctx,
          subject,
          predicate,
          null,
          `[SYSTEM-GENERATED] No facts extracted for ${subject} ${predicate}`,
        );
        const assertionId = shortId("A", ctx.assertionCounter++);
        const factId = shortId("F", ctx.factCounter++);

        ctx.assertionRegistry.set(assertionId, {
          assertionId,
          propositionId,
          assertionType: AssertionType.ALLEGED,
          polarity: AssertionPolarity.UNKNOWN,
          sourceSpan: {
            documentId: "SYSTEM",
            segment: `[AUTO] No extraction for ${subject} ${predicate}`,
            sourceType: "OTHER",
            extractionMethod: "STRUCTURED_INPUT",
          },
        });

        ctx.factRegistry.set(factId, {
          factId,
          propositionId,
          assertionId,
          proposition: `[AUTO] ${subject} ${predicate} — not mentioned in input`,
          subject,
          predicate,
          object: null,
          truth: Tristate.UNKNOWN,
          polarity: AssertionPolarity.UNKNOWN,
          source: {
            documentId: "SYSTEM",
            segment: `[AUTO] No extraction for ${subject} ${predicate}`,
            sourceType: "OTHER",
            extractionMethod: "STRUCTURED_INPUT",
          },
          assertionType: AssertionType.ALLEGED,
          validationStatus: ValidationStatus.UNVERIFIED,
          confidence: FactConfidence.CANDIDATE,
          validation: {
            extractionStatus: ExtractionStatus.NOT_EXECUTED,
            sourceStatus: SourceStatus.UNRESOLVED,
            authenticationStatus: AuthenticationStatus.NOT_EXECUTED,
            corroborationStatus: CorroborationStatus.NOT_EXECUTED,
            humanValidationStatus: HumanValidationStatus.NOT_EXECUTED,
          },
        });
      }
    }
  }

  private buildContradictionGraph(ctx: ExecutionContext): void {
    const facts = Array.from(ctx.factRegistry.values());
    const familyMap = new Map<string, AtomicFact[]>();

    // Group facts by proposition family (subject|predicate, ignoring object)
    for (const fact of facts) {
      const familyKey = `${fact.subject}|${fact.predicate}`.toUpperCase();
      if (!familyMap.has(familyKey)) familyMap.set(familyKey, []);
      familyMap.get(familyKey)!.push(fact);
    }

    let edgeCounter = 1;

    for (const [familyKey, familyFacts] of familyMap) {
      if (familyFacts.length < 2) continue;

      const mode = getConflictModeFromFacts(ctx, familyFacts[0].subject, familyFacts[0].predicate);

      if (mode === "NON_CONTRADICTORY" || mode === "MULTI_VALUED" || mode === "NUMERIC_RANGE") {
        // These modes never produce contradictions within a family
        continue;
      }

      for (let i = 0; i < familyFacts.length; i++) {
        for (let j = i + 1; j < familyFacts.length; j++) {
          const left = familyFacts[i];
          const right = familyFacts[j];
          let isConflict = false;

          if (mode === "BOOLEAN_EXCLUSIVE") {
            // Conflict if one is TRUE and the other is FALSE (object doesn't matter)
            isConflict =
              (left.truth === Tristate.TRUE && right.truth === Tristate.FALSE) ||
              (left.truth === Tristate.FALSE && right.truth === Tristate.TRUE);
          } else if (mode === "ENUM_EXCLUSIVE") {
            // FIX #5: Only conflict if DIFFERENT objects AND both TRUE
            // Old bug: treated all same-subject-predicate as contradictory regardless of truth
            isConflict =
              left.object !== right.object &&
              left.truth === Tristate.TRUE &&
              right.truth === Tristate.TRUE;
          } else if (mode === "NUMERIC_EQUALITY") {
            // Conflict if different numeric values and both TRUE
            const leftNum =
              left.normalizedValue !== null && left.normalizedValue !== undefined
                ? Number(left.normalizedValue)
                : NaN;
            const rightNum =
              right.normalizedValue !== null && right.normalizedValue !== undefined
                ? Number(right.normalizedValue)
                : NaN;
            isConflict =
              !isNaN(leftNum) &&
              !isNaN(rightNum) &&
              leftNum !== rightNum &&
              left.truth === Tristate.TRUE &&
              right.truth === Tristate.TRUE;
          }

          if (isConflict) {
            const edge: ContradictionEdge = {
              edgeId: `EDGE-${String(edgeCounter++).padStart(5, "0")}`,
              propositionKey: familyKey,
              leftFactId: left.factId,
              rightFactId: right.factId,
              relation: "DIRECT_TRUTH_CONFLICT",
              status:
                left.truth === Tristate.TRUE && right.truth === Tristate.TRUE
                  ? "CRITICAL"
                  : "PENDING_VALIDATION",
            };
            ctx.contradictionGraph.push(edge);

            // Record on facts themselves
            if (!left.contradicts) left.contradicts = [];
            if (!right.contradicts) right.contradicts = [];
            left.contradicts.push(right.factId);
            right.contradicts.push(left.factId);
          }
        }
      }
    }
  }

  /** ISSUE 1: logCriticalConflicts NEVER throws. Data only. */
  private logCriticalConflicts(ctx: ExecutionContext): void {
    const criticalEdges = ctx.contradictionGraph.filter(
      (e) => e.status === "CRITICAL",
    );
    if (criticalEdges.length > 0) {
      recordTrace(ctx, {
        layer: "P0_EXTRACTION",
        description: `CRITICAL_CONFLICT_DATA: ${criticalEdges.length} critical contradiction edge(s) recorded. No throw — data propagated to F0 gate.`,
        dependsOnFacts: criticalEdges.flatMap((e) => [e.leftFactId, e.rightFactId]),
        dependsOnRules: [],
        result: `EDGES:[${criticalEdges.map((e) => e.edgeId).join(",")}]`,
      });
      ctx.warnings.push(
        `CRITICAL: ${criticalEdges.length} contradiction edge(s) detected. F0 gate will evaluate.`,
      );
    }
  }

  // ========================================================================
  // EVENT TIMELINE
  // ========================================================================

  private buildEventTimeline(ctx: ExecutionContext): void {
    const factsWithDates = Array.from(ctx.factRegistry.values()).filter(
      (f) => f.eventDate && isStrictDate(f.eventDate),
    );

    factsWithDates.sort(
      (a, b) => strictDateTimestamp(a.eventDate!) - strictDateTimestamp(b.eventDate!),
    );

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

  private inferEventType(fact: AtomicFact): LegalEventType {
    if (fact.predicate === "Vital Status" && fact.object === "DECEASED")
      return "ANCESTOR_DEATH";
    if (fact.predicate === "Execution Date")
      return "AGREEMENT_EXECUTION";
    if (fact.predicate === "Refusal Date")
      return "REFUSAL";
    if (fact.predicate === "Demand Date")
      return "DEMAND";
    if (fact.predicate === "Payment Status" && fact.object === "DEPOSITED")
      return "PAYMENT";
    if (fact.predicate === "Possession Status" && fact.object === "DISPOSSESSED")
      return "DISPOSSESSION";
    if (fact.predicate === "Registration Status")
      return "REGISTRATION";
    if (fact.predicate === "Mutation Status")
      return "AMENDMENT";
    if (fact.predicate === "Construction Status" && fact.object === "UNAUTHORIZED")
      return "ENCROACHMENT";
    if (fact.predicate === "Ownership Structure" && fact.object === "JOINT")
      return "OTHER";
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

    // Find ALL facts in this proposition family (subject|predicate|*)
    const familyFacts = Array.from(ctx.factRegistry.values()).filter(
      (f) =>
        f.subject.toUpperCase() === subjectUpper &&
        f.predicate.toUpperCase() === predicateUpper,
    );

    // Same-family conflicting facts (ISSUE 3: even when object filter hides them)
    const sameFamilyConflictingFacts = familyFacts
      .filter((f) => f.truth === Tristate.TRUE)
      .map((f) => ({
        factId: f.factId,
        object: f.object,
        truth: f.truth,
      }));

    const conflictDetected =
      sameFamilyConflictingFacts.length > 1 &&
      new Set(sameFamilyConflictingFacts.map((f) => f.object)).size > 1;

    // Filter to matching facts (by object if specified)
    const matchingFacts = objectFilter
      ? familyFacts.filter(
          (f) => f.object?.toUpperCase() === objectFilter.toUpperCase(),
        )
      : familyFacts;

    // Evaluate each matching fact
    let bestStatus = Tristate.UNKNOWN;
    const supportingFactIds: string[] = [];
    let validationDetails: FactEvaluationResult["validationDetails"] = undefined;

    for (const fact of matchingFacts) {
      // Check validation requirements
      let passesValidation = true;

      if (options.validationRequirements) {
        // ISSUE 13-14: Use explicit per-predicate requirements
        passesValidation = meetsValidationRequirements(
          fact,
          options.validationRequirements,
        );
      } else if (options.requireVerified) {
        // FIX #3: requireVerified: true means VERIFIED (not IDENTIFIED)
        passesValidation = fact.validationStatus === ValidationStatus.VERIFIED;
      }

      if (!passesValidation) continue;

      // Update best status: TRUE > FALSE > UNKNOWN
      if (fact.truth === Tristate.TRUE) {
        bestStatus = Tristate.TRUE;
        supportingFactIds.push(fact.factId);
        validationDetails = {
          sourceStatus: fact.validation.sourceStatus,
          authenticationStatus: fact.validation.authenticationStatus,
          corroborationStatus: fact.validation.corroborationStatus,
          humanValidationStatus: fact.validation.humanValidationStatus,
        };
        break; // Found a verified TRUE — best possible
      } else if (fact.truth === Tristate.FALSE && bestStatus !== Tristate.TRUE) {
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

    return {
      status: bestStatus,
      supportingFactIds,
      conflictDetected,
      sameFamilyConflictingFacts,
      validationDetails,
    };
  }

  // ========================================================================
  // P1 STAGES
  // ========================================================================

  private resolveClaimType(
    factPattern: string,
    focusDomain: string,
  ): ClaimType {
    const lower = factPattern.toLowerCase();
    const domain = (focusDomain || "").toLowerCase();

    if (
      domain.includes("inheritance") ||
      domain.includes("succession") ||
      lower.includes("heir") ||
      lower.includes("succession") ||
      lower.includes("warisan") ||
      lower.includes("co-sharer")
    ) {
      return "INHERITANCE_CONSULTATION";
    }
    if (
      domain.includes("specific performance") ||
      lower.includes("bainapatra") ||
      lower.includes("specific performance") ||
      lower.includes("section 21a")
    ) {
      return "SPECIFIC_PERFORMANCE";
    }
    if (
      domain.includes("declaration") ||
      domain.includes("possession") ||
      lower.includes("declaration of title") ||
      lower.includes("recovery of possession") ||
      lower.includes("section 8") ||
      lower.includes("section 42")
    ) {
      return "DECLARATION_AND_POSSESSION";
    }
    return "GENERAL_CIVIL";
  }

  private classifyDomain(
    ctx: ExecutionContext,
    claimType: ClaimType,
  ): StageExecutionResult {
    const domainMap: Record<ClaimType, { primary: string; subsidiary: string[] }> = {
      SPECIFIC_PERFORMANCE: {
        primary: "Contract Law — Specific Performance",
        subsidiary: ["Property Law", "Registration Law", "Limitation Law"],
      },
      DECLARATION_AND_POSSESSION: {
        primary: "Property Law — Title & Possession",
        subsidiary: ["Transfer of Property", "Evidence Law", "Limitation Law"],
      },
      INHERITANCE_CONSULTATION: {
        primary: "Succession Law — Inheritance & Partition",
        subsidiary: ["Property Law", "Evidence Law", "Limitation Law"],
      },
      GENERAL_CIVIL: {
        primary: "General Civil Litigation",
        subsidiary: ["Evidence Law", "Procedural Law"],
      },
    };

    const mapping = domainMap[claimType];
    recordTrace(ctx, {
      layer: "P1_RULE",
      description: `Domain classified: ${mapping.primary}`,
      dependsOnFacts: getAllFactIds(ctx),
      dependsOnRules: [],
      result: mapping.primary,
    });

    return {
      stageName: "Domain Classification",
      status: "SATISFIED",
      details: `Primary domain: ${mapping.primary}`,
      data: mapping,
    };
  }

  private mapLegislation(
    ctx: ExecutionContext,
    claimType: ClaimType,
  ): StageExecutionResult {
    const legislation = this.ruleRegistry.getLegislationMapping(claimType);

    // Evaluate ancestor vital status for context-aware precedent selection
    const ancestorResult = this.evaluateFact(ctx, "Ancestor", "Vital Status", "DECEASED", {
      requireVerified: false,
      objectFilter: null,
    });
    const isAncestorDeceased = ancestorResult.status === Tristate.TRUE;
    const isAncestorLiving = ancestorResult.status === Tristate.FALSE;
    const ancestorStatusDetermined =
      ancestorResult.status === Tristate.TRUE || ancestorResult.status === Tristate.FALSE;

    const precedents = CitationValidator.getVerifiedPrecedentsForContext(claimType, {
      isAncestorDeceased: ancestorStatusDetermined ? isAncestorDeceased : undefined,
    });

    recordTrace(ctx, {
      layer: "P1_RULE",
      description: `Precedent selection: category=${claimType}, ancestorDeceased=${isAncestorDeceased}, determined=${ancestorStatusDetermined}, precedents=${precedents.length}`,
      dependsOnFacts: ancestorResult.supportingFactIds,
      dependsOnRules: [],
      result: `PRECEDENTS_SELECTED:${precedents.length}`,
    });

    return {
      stageName: "Legislation Mapping",
      status: "SATISFIED",
      details: `Primary act: ${legislation.primaryAct}. Verified precedents: ${precedents.length}. Ancestor deceased: ${ancestorStatusDetermined ? isAncestorDeceased : "UNDETERMINED"}.`,
      data: { legislation, precedents },
    };
  }

  private executeLimitationEngine(
    ctx: ExecutionContext,
    claimType: ClaimType,
  ): StageExecutionResult {
    const facts = Array.from(ctx.factRegistry.values());

    const agreementDate = this.findDateFact(facts, "Bainapatra", "Execution Date");
    const refusalDate = this.findDateFact(facts, "Defendant", "Refusal Date");
    const deathDate = this.findDateFact(facts, "Ancestor", "Vital Status", "DECEASED");

    let accrualDate: string | null = null;
    let prescribedPeriod = "N/A";
    let limitationArticle = "N/A";
    let isTimeBarred = false;
    let calculationType: "real_refusal" | "real_death" | "heuristic_6_months" | "missing_dates" | "other_category" = "missing_dates";
    let validationStatus: "valid" | "heuristic_applied" | "invalid_gaps" = "invalid_gaps";
    let explanation = "";

    if (claimType === "SPECIFIC_PERFORMANCE") {
      limitationArticle = "Article 54, Limitation Act 1908";
      prescribedPeriod = "3 years from date of refusal/failure to perform";

      if (refusalDate && isStrictDate(refusalDate)) {
        accrualDate = refusalDate;
        calculationType = "real_refusal";
        const refusalTs = strictDateTimestamp(refusalDate);
        const limitTs = refusalTs + 3 * 365.25 * 24 * 60 * 60 * 1000;
        isTimeBarred = Date.now() > limitTs;
        validationStatus = "valid";
        explanation = `Limitation computed from refusal date ${refusalDate}. 3-year period ${isTimeBarred ? "EXPIRED." : "active."}`;
      } else if (agreementDate && isStrictDate(agreementDate)) {
        accrualDate = agreementDate;
        calculationType = "heuristic_6_months";
        const agreeTs = strictDateTimestamp(agreementDate);
        const limitTs = agreeTs + 3 * 365.25 * 24 * 60 * 60 * 1000;
        isTimeBarred = Date.now() > limitTs;
        validationStatus = "heuristic_applied";
        explanation = `No explicit refusal date found. Using agreement date ${agreementDate} as heuristic accrual. 3-year period ${isTimeBarred ? "EXPIRED." : "active."}`;
      } else {
        explanation = "Neither refusal date nor agreement date could be extracted. Limitation cannot be computed.";
      }
    } else if (claimType === "INHERITANCE_CONSULTATION") {
      limitationArticle = "Article 123/144, Limitation Act 1908";
      prescribedPeriod = "12 years from date of death";

      if (deathDate && isStrictDate(deathDate)) {
        accrualDate = deathDate;
        calculationType = "real_death";
        const deathTs = strictDateTimestamp(deathDate);
        const limitTs = deathTs + 12 * 365.25 * 24 * 60 * 60 * 1000;
        isTimeBarred = Date.now() > limitTs;
        validationStatus = "valid";
        explanation = `Limitation computed from death date ${deathDate}. 12-year period ${isTimeBarred ? "EXPIRED." : "active."}`;
      } else {
        explanation = "Death date not extracted or not parseable. Limitation cannot be computed.";
      }
    } else if (claimType === "DECLARATION_AND_POSSESSION") {
      limitationArticle = "Article 65, Limitation Act 1908";
      prescribedPeriod = "12 years from date of dispossession";
      explanation = "Dispossession date required for precise computation.";
    }

    recordTrace(ctx, {
      layer: "P1_TEMPORAL",
      description: `Limitation: article=${limitationArticle}, barred=${isTimeBarred}, type=${calculationType}, accrual=${accrualDate ?? "NULL"}`,
      dependsOnFacts: [],
      dependsOnRules: [],
      result: accrualDate ? (isTimeBarred ? "TIME_BARRED" : "WITHIN_LIMITATION") : "INDETERMINATE",
    });

    return {
      stageName: "Limitation Engine",
      status: accrualDate ? "SATISFIED" : "UNKNOWN",
      details: explanation,
      data: {
        accrualDate,
        prescribedPeriod,
        limitationArticle,
        isTimeBarred,
        exceptionsOrExtensions: "",
        preliminaryAnalysis: explanation,
        timelineValidation: claimType === "INHERITANCE_CONSULTATION"
          ? {
              agreementDate: null,
              refusalDate: null,
              isAgreementDateExtracted: false,
              isRefusalDateExtracted: false,
              calculationType,
              validationStatus,
              explanation,
            }
          : {
              agreementDate,
              refusalDate,
              isAgreementDateExtracted: agreementDate !== null && isStrictDate(agreementDate),
              isRefusalDateExtracted: refusalDate !== null && isStrictDate(refusalDate),
              calculationType,
              validationStatus,
              explanation,
            },
      },
    };
  }

  private executeElementCompletenessGate(
    ctx: ExecutionContext,
    claimType: ClaimType,
  ): ElementGateResult {
    const rules = this.ruleRegistry.getClaimElements(claimType, "BANGLADESH");
    const ruleExecutionResults: RuleExecutionResult[] = [];
    const missingElements: string[] = [];
    const unknownElements: string[] = [];
    const fatalFailures: string[] = [];

    for (const rule of rules) {
      const predicateResults: PredicateExecutionResult[] = [];
      let allPredicatesSatisfied = true;
      let anyPredicateUnknown = false;
      let anyPredicateFailed = false;

      for (const rp of rule.predicates) {
        const evalResult = this.evaluateFact(
          ctx,
          rp.subject,
          rp.predicate,
          rp.object ?? null,
          {
            requireVerified: rp.requireVerified,
            validationRequirements: rp.validationRequirements,
            objectFilter: rp.object ?? null,
          },
        );

        let predicateStatus: "TRUE" | "FALSE" | "UNKNOWN";
        if (evalResult.status === Tristate.TRUE) {
          predicateStatus = "TRUE";
        } else if (evalResult.status === Tristate.FALSE) {
          predicateStatus = "FALSE";
          anyPredicateFailed = true;
          allPredicatesSatisfied = false;
        } else {
          predicateStatus = "UNKNOWN";
          anyPredicateUnknown = true;
          allPredicatesSatisfied = false;
        }

        predicateResults.push({
          predicateSubject: rp.subject,
          predicateId: rp.predicateId,
          status: predicateStatus,
          factIds: evalResult.supportingFactIds,
          conflictDetected: evalResult.conflictDetected || undefined,
          sameFamilyConflictingFacts:
            evalResult.sameFamilyConflictingFacts.length > 0
              ? evalResult.sameFamilyConflictingFacts
              : undefined,
        });
      }

      // Determine rule status
      let ruleStatus: RuleExecutionStatus;
      let explanationCode: string;

      if (allPredicatesSatisfied) {
        ruleStatus = "SATISFIED";
        explanationCode = rule.outcomeIfSatisfied;
      } else if (anyPredicateFailed) {
        ruleStatus = "FAILED";
        explanationCode = rule.outcomeIfFailed;
        fatalFailures.push(rule.ruleId);
      } else {
        ruleStatus = "UNKNOWN";
        explanationCode = `ELEMENT_UNKNOWN:${rule.ruleId}`;
        unknownElements.push(rule.ruleId);
      }

      if (!allPredicatesSatisfied && !anyPredicateFailed) {
        missingElements.push(rule.ruleId);
      }

      ruleExecutionResults.push({
        ruleId: rule.ruleId,
        status: ruleStatus,
        predicateResults,
        authorityIds: rp_authorityIds(rule),
        burden: rule.burden,
        legalEffect: rule.legalEffect,
        explanationCode,
        authorityStatus: this.authorityStatus,
      });

      recordTrace(ctx, {
        layer: "P1_ELEMENT_GATE",
        description: `Rule ${rule.ruleId}: ${ruleStatus} — ${explanationCode}`,
        dependsOnFacts: predicateResults.flatMap((p) => p.factIds),
        dependsOnRules: [rule.ruleId],
        result: ruleStatus,
      });
    }

    const allSatisfied = ruleExecutionResults.every(
      (r) => r.status === "SATISFIED",
    );
    const hasFatalFailure = fatalFailures.length > 0;

    let gateStatus: GateStatus;
    if (hasFatalFailure) {
      gateStatus = GateStatus.FAIL;
    } else if (allSatisfied) {
      gateStatus = GateStatus.PASS;
    } else {
      gateStatus = GateStatus.INDETERMINATE;
    }

    return {
      status: gateStatus,
      allSatisfied,
      missingElements,
      unknownElements,
      fatalFailures,
      ruleExecutionResults,
    };
  }

  // ========================================================================
  // REMAINING P1 STAGES
  // ========================================================================

  private executePartyStandiRules(
    ctx: ExecutionContext,
    claimType: ClaimType,
  ): StageExecutionResult {
    const facts = Array.from(ctx.factRegistry.values());
    const lower = (f: AtomicFact) => f.proposition.toLowerCase();

    const hasPlaintiffMention = facts.some(
      (f) => lower(f).includes("plaintiff") || lower(f).includes("petitioner"),
    );
    const hasDefendantMention = facts.some(
      (f) => lower(f).includes("defendant") || lower(f).includes("respondent"),
    );

    if (!hasPlaintiffMention || !hasDefendantMention) {
      return {
        stageName: "Party Locus Standi",
        status: "UNKNOWN",
        details: "Insufficient party information to determine standing.",
        data: {
          plaintiffs: [],
          defendants: [],
          joinderIssues: hasPlaintiffMention || hasDefendantMention
            ? "One party side not clearly identified in the narrative."
            : "No parties clearly identified.",
          locusStandiSummary: "UNKNOWN — party roles could not be determined from the fact pattern.",
        },
      };
    }

    // Build basic party info
    const plaintiffs: Array<{ name: string; legalIdentity: string; capacity: string; causeOfActionAccess: string }> = [];
    const defendants: Array<{ name: string; legalIdentity: string; capacity: string; liabilityType: string }> = [];

    plaintiffs.push({
      name: "Plaintiff (identified from narrative)",
      legalIdentity: "NOT_EXTRACTED",
      capacity: "NOT_DETERMINED",
      causeOfActionAccess: claimType === "INHERITANCE_CONSULTATION"
        ? "Statutory co-sharer heir (pending verification)"
        : "Claimant under cited cause of action",
    });
    defendants.push({
      name: "Defendant (identified from narrative)",
      legalIdentity: "NOT_EXTRACTED",
      capacity: "NOT_DETERMINED",
      liabilityType: "TO_BE_DETERMINED",
    });

    recordTrace(ctx, {
      layer: "P1_RULE",
      description: "Party standing: basic identification complete.",
      dependsOnFacts: [],
      dependsOnRules: [],
      result: "SATISFIED",
    });

    return {
      stageName: "Party Locus Standi",
      status: "SATISFIED",
      details: "Basic party identification complete. Detailed capacity requires document verification.",
      data: {
        plaintiffs,
        defendants,
        joinderIssues: "",
        locusStandiSummary: "Parties identified from narrative. Full legal identity and capacity require document-level verification.",
      },
    };
  }

  /** ISSUE 5-8: BLOCKED if element gate HALTed. */
  private executePleadingRules(elementGate: ElementGateResult): StageExecutionResult {
    if (elementGate.status === GateStatus.HALT) {
      return {
        stageName: "Pleading Compliance",
        status: "BLOCKED",
        details: "BLOCKED: Upstream element gate halted with fatal failures.",
      };
    }

    const groundsForRejection: string[] = [];
    const plaintChecklist: string[] = [
      "Cause of action stated",
      "Relief claimed",
      "Jurisdictional facts",
      "Valuation for court fee",
    ];

    if (elementGate.fatalFailures.length > 0) {
      groundsForRejection.push(
        `Essential element(s) failed: ${elementGate.fatalFailures.join(", ")}`,
      );
    }

    return {
      stageName: "Pleading Compliance",
      status: groundsForRejection.length > 0 ? "FAILED" : "SATISFIED",
      details: groundsForRejection.length > 0
        ? `Grounds for rejection: ${groundsForRejection.join("; ")}`
        : "No automatic grounds for rejection detected.",
      data: { plaintChecklist, groundsForRejection, writtenStatementDeemedAdmissions: "", counterclaimsOrSetOff: "" },
    };
  }

  /** ISSUE 5-8: BLOCKED if element gate HALTed. */
  private executeIssueFramingRules(
    ctx: ExecutionContext,
    elementGate: ElementGateResult,
  ): StageExecutionResult {
    if (elementGate.status === GateStatus.HALT) {
      return {
        stageName: "Issue Framing",
        status: "BLOCKED",
        details: "BLOCKED: Upstream element gate halted.",
      };
    }

    const issues: Array<{
      issueNo: number;
      title: string;
      type: string;
      burden: string;
      evidenceRequired: string;
    }> = [];

    let issueNo = 1;
    for (const rule of elementGate.ruleExecutionResults) {
      for (const pr of rule.predicateResults) {
        if (pr.status === "UNKNOWN" || pr.status === "FALSE") {
          issues.push({
            issueNo: issueNo++,
            title: `Whether ${pr.predicateSubject} ${pr.predicateId.replace(/^.*-/, "")} is established`,
            type: rule.status === "FAILED" ? "PRELIMINARY" : "SUBSTANTIVE",
            burden: "PLAINTIFF",
            evidenceRequired: pr.status === "UNKNOWN"
              ? "Documentary and oral evidence required"
              : "Evidence to rebut adverse finding",
          });
        }
      }
    }

    recordTrace(ctx, {
      layer: "P1_RULE",
      description: `Issue framing: ${issues.length} issue(s) identified.`,
      dependsOnFacts: [],
      dependsOnRules: elementGate.ruleExecutionResults.map((r) => r.ruleId),
      result: issues.length > 0 ? "ISSUES_FRAMED" : "NO_DISPUTED_ISSUES",
    });

    return {
      stageName: "Issue Framing",
      status: issues.length > 0 ? "SATISFIED" : "UNKNOWN",
      details: `${issues.length} issue(s) framed from element gate analysis.`,
      data: { issues },
    };
  }

  private executeEvidenceRules(ctx: ExecutionContext): StageExecutionResult {
    const facts = Array.from(ctx.factRegistry.values());
    const evidenceList: Array<{
      item: string;
      source: string;
      type: string;
      governingSection: string;
      admissibilityChallenge: string;
    }> = [];

    for (const fact of facts) {
      if (fact.assertionType === AssertionType.DOCUMENTARY_FACT) {
        evidenceList.push({
          item: fact.proposition,
          source: fact.source.documentId,
          type: "DOCUMENTARY",
          governingSection: "Section 91-100, Evidence Act 1872",
          admissibilityChallenge: "",
        });
      } else if (fact.assertionType === AssertionType.COURT_FINDING) {
        evidenceList.push({
          item: fact.proposition,
          source: fact.source.documentId,
          type: "JUDICIAL_NOTICE",
          governingSection: "Section 57, Evidence Act 1872",
          admissibilityChallenge: "",
        });
      } else if (fact.source.extractionMethod === "PATTERN") {
        evidenceList.push({
          item: fact.proposition,
          source: `Paragraph ${fact.source.paragraph ?? "?"}`,
          type: "ORAL_ASSERTION",
          governingSection: "Section 60, Evidence Act 1872",
          admissibilityChallenge: "Requires corroboration — uncorroborated oral assertion from narrative.",
        });
      }
    }

    recordTrace(ctx, {
      layer: "P1_EVIDENCE",
      description: `Evidence inventory: ${evidenceList.length} item(s).`,
      dependsOnFacts: facts.map((f) => f.factId),
      dependsOnRules: [],
      result: "SATISFIED",
    });

    return {
      stageName: "Evidence Rules",
      status: "SATISFIED",
      details: `${evidenceList.length} evidence item(s) catalogued.`,
      data: {
        evidenceList,
        burdenAssignments: "Plaintiff bears burden under Sections 101-103, Evidence Act 1872.",
        statutoryPresumptions: [],
      },
    };
  }

  /** ISSUE 12: Merit rules always NOT_EXECUTED — engine does not determine merits. */
  private executeMeritRules(elementGate: ElementGateResult): StageExecutionResult {
    return {
      stageName: "Merit Determination",
      status: "NOT_EXECUTED",
      details: "Merit determination is reserved for human judicial analysis. The BCCAA engine performs structural and procedural analysis only; it does not render substantive merit findings on issues of fact.",
      data: {
        issueDetails: elementGate.ruleExecutionResults.map((r) => ({
          issueNo: 0,
          issueTitle: r.explanationCode,
          plaintiffPosition: "NOT_EVALUATED",
          defendantPosition: "NOT_EVALUATED",
          courtAnalysis: "RESERVED_FOR_COURT",
          projectedFinding: "INDETERMINATE",
        })),
      },
    };
  }

  /** ISSUE 5-8: BLOCKED if element gate HALTed. */
  private executeEquityRules(elementGate: ElementGateResult): StageExecutionResult {
    if (elementGate.status === GateStatus.HALT) {
      return {
        stageName: "Equity Principles",
        status: "BLOCKED",
        details: "BLOCKED: Upstream element gate halted.",
      };
    }

    return {
      stageName: "Equity Principles",
      status: "SATISFIED",
      details: "Equity analysis: no automatic discretionary bars detected from fact pattern.",
      data: {
        applicablePrinciples: [
          {
            principle: "Clean hands doctrine",
            application: "No facts suggesting plaintiff's unconscionable conduct detected.",
            weight: "LOW",
          },
          {
            principle: "Laches / undue delay",
            application: "To be assessed against limitation calculation in Stage 3.",
            weight: "MEDIUM",
          },
        ],
        discretionaryReliefCheck: "No automatic discretionary bar detected. Court discretion reserved.",
      },
    };
  }

  private executeProcedureRules(
    ctx: ExecutionContext,
    claimType: ClaimType,
  ): StageExecutionResult {
    const timelineProgress: Array<{
      stageName: string;
      cpcReference: string;
      subActions: string;
      strategicPlay: string;
    }> = [
      {
        stageName: "Plaint Filing",
        cpcReference: "Order IV, CPC 1908",
        subActions: "Draft and file plaint with prescribed particulars",
        strategicPlay: "Ensure all mandatory averments under Order VII Rule 1 are present",
      },
      {
        stageName: "Summons & Service",
        cpcReference: "Order V, CPC 1908",
        subActions: "Issue summons to defendants; effect service",
        strategicPlay: "Track service timelines to prevent dismissal for non-appearance",
      },
      {
        stageName: "Written Statement",
        cpcReference: "Order VIII, CPC 1908",
        subActions: "File written statement within prescribed period",
        strategicPlay: "Identify deemed admissions from silence or evasive denials",
      },
      {
        stageName: "Framing of Issues",
        cpcReference: "Order XIV, CPC 1908",
        subActions: "Court frames issues based on pleadings",
        strategicPlay: "Ensure all material issues from element gate are raised",
      },
      {
        stageName: "Trial & Evidence",
        cpcReference: "Order XVI-XVIII, CPC 1908",
        subActions: "Lead evidence, cross-examination, arguments",
        strategicPlay: "Present evidence to satisfy element predicates identified as UNKNOWN",
      },
      {
        stageName: "Judgment & Decree",
        cpcReference: "Order XX, CPC 1908",
        subActions: "Court pronounces judgment; decree drafted",
        strategicPlay: "Ensure decree conforms to prayer and element findings",
      },
    ];

    const territorial = {
      rule: "Bangladesh civil courts have territorial jurisdiction over immovable property situated in Bangladesh.",
      governingSection: "Section 15-20, CPC 1908",
      jurisdictionalFacts: "Suit property is situated within Bangladesh.",
    };

    const pecuniary = {
      valuation: "TO_BE_DETERMINED from quantum facts",
      courtLevel: "TO_BE_DETERMINED based on valuation",
      pecuniaryLimits: "Section 6-11, Suits Valuation Act 1887",
      suitsValuationActNotes: "Court fee payable on plaint value as per Court Fees Act 1870.",
    };

    const subjectMatter = {
      isExcluded: false,
      forum: "Civil Court",
      governingStatute: claimType === "SPECIFIC_PERFORMANCE"
        ? "Specific Relief Act 1877"
        : claimType === "INHERITANCE_CONSULTATION"
          ? "Partition Act 1893 / Muslim Personal Law"
          : "Code of Civil Procedure 1908",
    };

    recordTrace(ctx, {
      layer: "P1_RULE",
      description: "Procedural rules: 6-stage timeline mapped.",
      dependsOnFacts: [],
      dependsOnRules: [],
      result: "SATISFIED",
    });

    return {
      stageName: "Procedural Compliance",
      status: "SATISFIED",
      details: "Procedural framework mapped. Jurisdiction: territorial OK, pecuniary TBD.",
      data: {
        territorial,
        pecuniary,
        subjectMatter,
        objectionStrategy: "No automatic jurisdictional objection detected.",
        timelineProgress,
      },
    };
  }

  private executeAppealRules(): StageExecutionResult {
    return {
      stageName: "Appeal Framework",
      status: "SATISFIED",
      details: "Appeal framework mapped for Bangladesh civil litigation.",
      data: {
        appealNodes: [
          {
            level: "First Appeal",
            authority: "District Judge / Additional District Judge",
            scope: "Questions of fact and law",
            governingSection: "Section 96-100, CPC 1908",
          },
          {
            level: "Second Appeal",
            authority: "High Court Division, Supreme Court of Bangladesh",
            scope: "Substantial question of law only",
            governingSection: "Section 100, CPC 1908",
          },
          {
            level: "Leave to Appeal",
            authority: "Appellate Division, Supreme Court of Bangladesh",
            scope: "Certified question of law of public importance",
            governingSection: "Article 103, Constitution of Bangladesh",
          },
          {
            level: "Review",
            authority: "Same court that passed decree",
            scope: "Clerical errors, discovery of new evidence",
            governingSection: "Section 114, CPC 1908",
          },
        ],
      },
    };
  }

  // ========================================================================
  // FIX #8: EXECUTION STATUS — inspects every stage, distinguishes BLOCKED
  // ========================================================================

  private determineExecutionStatus(
    standi: StageExecutionResult,
    pleading: StageExecutionResult,
    issues: StageExecutionResult,
    evidence: StageExecutionResult,
    merits: StageExecutionResult,
    equity: StageExecutionResult,
    procedure: StageExecutionResult,
    appeal: StageExecutionResult,
  ): PipelineExecutionStatus {
    const stages = [standi, pleading, issues, evidence, merits, equity, procedure, appeal];

    const notExecuted = stages.filter((s) => s.status === "NOT_EXECUTED").length;
    const blocked = stages.filter((s) => s.status === "BLOCKED").length;
    const failed = stages.filter((s) => s.status === "FAILED").length;
    const executed = stages.length - notExecuted - blocked;

    if (failed > 0) return "ERROR";
    if (blocked > 0) return "BLOCKED";
    if (executed === 0) return "NOT_EXECUTED";
    if (notExecuted === 0 && blocked === 0) return "COMPLETED";
    return "PARTIAL";
  }

  // ========================================================================
  // FIX #5-6: OUTCOME — distinguishes SUCCESS/STRUCTURAL_ONLY/PARTIAL/etc.
  // ========================================================================

  private determineOutcome(
    executionStatus: PipelineExecutionStatus,
    elementGate: ElementGateResult,
  ): ExecutionOutcome {
    if (executionStatus === "ERROR") return "ERROR";
    if (executionStatus === "NOT_EXECUTED") return "ERROR";
    if (executionStatus === "BLOCKED") return "HALTED";

    // Merit rules are always NOT_EXECUTED — so COMPLETED is impossible
    // The best possible outcome is STRUCTURAL_ONLY
    if (executionStatus === "PARTIAL") {
      if (elementGate.allSatisfied) return "STRUCTURAL_ONLY";
      if (elementGate.status === GateStatus.INDETERMINATE) return "INDETERMINATE";
      return "PARTIAL";
    }

    // COMPLETED (all stages except merits executed)
    if (elementGate.allSatisfied) return "STRUCTURAL_ONLY";
    if (elementGate.status === GateStatus.FAIL) return "HALTED";
    return "INDETERMINATE";
  }

  // ========================================================================
  // P2: FAIL-CLOSED SYNTHESIS
  // ========================================================================

  private executeFailClosedSynthesis(
    ctx: ExecutionContext,
    f0Gate: FactConsistencyGateOutput,
    claimType: ClaimType,
    elementGate: ElementGateResult,
  ): SynthesisResult {
    if (f0Gate.gateStatus === "HALT_CRITICAL_CONFLICT") {
      return {
        status: "HALTED",
        conclusion: f0Gate.summary,
        confidence: "NONE",
        requiresHumanReview: true,
        humanReviewReason: f0Gate.summary,
        elementSummary: [],
        legalConclusions: [
          "ANALYSIS HALTED: Critical fact contradictions prevent any downstream legal conclusion.",
          ...f0Gate.conflicts.map(
            (c) => `CONFLICT [${c.conflictId}]: ${c.description}`,
          ),
        ],
        recommendations: f0Gate.conflicts.map(
          (c) => `RESOLVE: ${c.resolutionRequirement}`,
        ),
      };
    }

    if (elementGate.status === GateStatus.HALT) {
      return {
        status: "HALTED",
        conclusion: "Element gate halted with fatal failures.",
        confidence: "NONE",
        requiresHumanReview: true,
        humanReviewReason: `Fatal element failures: ${elementGate.fatalFailures.join(", ")}`,
        elementSummary: elementGate.ruleExecutionResults.map((r) => ({
          ruleId: r.ruleId,
          status: r.status,
          explanation: r.explanationCode,
        })),
        legalConclusions: [
          "ANALYSIS HALTED: Fatal element failures prevent legal conclusion synthesis.",
        ],
        recommendations: elementGate.fatalFailures.map(
          (f) => `ADDRESS: Element ${f} has a fatal failure that must be resolved.`,
        ),
      };
    }

    if (elementGate.allSatisfied) {
      const conclusions = [
        `All claim elements for ${claimType} are structurally satisfied.`,
        "NOTE: This is a structural analysis only. Merit determination requires judicial evaluation of evidence.",
      ];
      return {
        status: "ELEMENTS_SATISFIED",
        conclusion: conclusions.join(" "),
        confidence: "STRUCTURAL_ONLY",
        requiresHumanReview: false,
        humanReviewReason: "",
        elementSummary: elementGate.ruleExecutionResults.map((r) => ({
          ruleId: r.ruleId,
          status: r.status,
          explanation: r.explanationCode,
        })),
        legalConclusions: conclusions,
        recommendations: [
          "Proceed to evidence-led merit determination in court.",
          "Ensure all document-level verification is completed before trial.",
        ],
      };
    }

    if (elementGate.status === GateStatus.FAIL) {
      return {
        status: "FAILED",
        conclusion: `Essential element(s) failed: ${elementGate.fatalFailures.join(", ")}. Claim is structurally unsustainable.`,
        confidence: "LOW",
        requiresHumanReview: true,
        humanReviewReason: `Failed elements may be curable by additional evidence: ${elementGate.fatalFailures.join(", ")}`,
        elementSummary: elementGate.ruleExecutionResults.map((r) => ({
          ruleId: r.ruleId,
          status: r.status,
          explanation: r.explanationCode,
        })),
        legalConclusions: [
          "STRUCTURAL FAILURE: One or more essential claim elements are not satisfied.",
          ...elementGate.fatalFailures.map(
            (f) => `FAILED ELEMENT: ${f}`,
          ),
        ],
        recommendations: [
          ...elementGate.missingElements.map(
            (m) => `SUPPLY EVIDENCE: ${m} is missing and must be established.`,
          ),
          ...elementGate.unknownElements.map(
            (u) => `CLARIFY: ${u} has indeterminate status — provide supporting documents.`,
          ),
        ],
      };
    }

    // INDETERMINATE
    return {
      status: "INDETERMINATE",
      conclusion: `Claim elements partially satisfied but key predicates remain unknown: ${elementGate.unknownElements.join(", ")}.`,
      confidence: "LOW",
      requiresHumanReview: true,
      humanReviewReason: `Unknown elements require factual clarification: ${elementGate.unknownElements.join(", ")}`,
      elementSummary: elementGate.ruleExecutionResults.map((r) => ({
        ruleId: r.ruleId,
        status: r.status,
        explanation: r.explanationCode,
      })),
      legalConclusions: [
        "INDETERMINATE: Structural analysis cannot reach a conclusion due to unresolved predicates.",
        ...elementGate.unknownElements.map(
          (u) => `UNKNOWN: ${u}`,
        ),
      ],
      recommendations: [
        ...elementGate.unknownElements.map(
          (u) => `PROVIDE EVIDENCE: ${u} requires factual substantiation.`,
        ),
      ],
    };
  }

  // ========================================================================
  // RESPONSE BUILDERS
  // ========================================================================

  private buildResponse(
    ctx: ExecutionContext,
    request: AnalyzeRequest,
    claimType: ClaimType,
    f0Gate: FactConsistencyGateOutput,
    synthesis: SynthesisResult,
    pipeline: {
      caseId: string;
      domain: StageExecutionResult;
      legislation: StageExecutionResult;
      limitation: StageExecutionResult;
      standi: StageExecutionResult;
      pleading: StageExecutionResult;
      issues: StageExecutionResult;
      evidence: StageExecutionResult;
      elementGate: ElementGateResult;
      merits: StageExecutionResult;
      equity: StageExecutionResult;
      procedure: StageExecutionResult;
      appeal: StageExecutionResult;
      executionStatus: PipelineExecutionStatus;
    },
  ): CaseAnalysisResponse {
    const domainData = pipeline.domain.data as {
      primary: string;
      subsidiary: string[];
    } | undefined;
    const legislationData = pipeline.legislation.data as {
      legislation: { primaryAct: string; relevantSections: Array<{ actName: string; sectionOrRule: string; purpose: string }> };
      precedents: Array<{
        citation: string; caseTitle: string; court: string; decisionYear: number;
        reporter: string; volume: number; page: number; bench?: string;
        statutorySubject: string; holding: string; relevance: string;
        ratioDecidendi: string; verificationStatus: string; verificationHash: string;
        isDeterministic: boolean; securityHashToken: string;
      }>;
    } | undefined;
    const limitationData = pipeline.limitation.data as {
      accrualDate: string | null; prescribedPeriod: string; limitationArticle: string;
      isTimeBarred: boolean; exceptionsOrExtensions: string; preliminaryAnalysis: string;
      timelineValidation?: {
        agreementDate: string | null; refusalDate: string | null;
        isAgreementDateExtracted: boolean; isRefusalDateExtracted: boolean;
        calculationType: string; validationStatus: string; explanation: string;
      };
    } | undefined;
    const standiData = pipeline.standi.data as {
      plaintiffs: Array<{ name: string; legalIdentity: string; capacity: string; causeOfActionAccess: string }>;
      defendants: Array<{ name: string; legalIdentity: string; capacity: string; liabilityType: string }>;
      joinderIssues: string; locusStandiSummary: string;
    } | undefined;
    const pleadingData = pipeline.pleading.data as {
      plaintChecklist: string[]; groundsForRejection: string[];
      writtenStatementDeemedAdmissions: string; counterclaimsOrSetOff: string;
    } | undefined;
    const issuesData = pipeline.issues.data as {
      issues: Array<{ issueNo: number; title: string; type: string; burden: string; evidenceRequired: string }>;
    } | undefined;
    const evidenceData = pipeline.evidence.data as {
      evidenceList: Array<{ item: string; source: string; type: string; governingSection: string; admissibilityChallenge: string }>;
      burdenAssignments: string; statutoryPresumptions: Array<{ statuteSection: string; presumptionStyle: string; effectOnCase: string }>;
    } | undefined;
    const meritsData = pipeline.merits.data as {
      issueDetails: Array<{ issueNo: number; issueTitle: string; plaintiffPosition: string; defendantPosition: string; courtAnalysis: string; projectedFinding: string }>;
    } | undefined;
    const equityData = pipeline.equity.data as {
      applicablePrinciples: Array<{ principle: string; application: string; weight: string }>;
      discretionaryReliefCheck: string;
    } | undefined;
    const procedureData = pipeline.procedure.data as {
      territorial: { rule: string; governingSection: string; jurisdictionalFacts: string };
      pecuniary: { valuation: string; courtLevel: string; pecuniaryLimits: string; suitsValuationActNotes: string };
      subjectMatter: { isExcluded: boolean; forum: string; governingStatute: string };
      objectionStrategy: string;
      timelineProgress: Array<{ stageName: string; cpcReference: string; subActions: string; strategicPlay: string }>;
    } | undefined;
    const appealData = pipeline.appeal.data as {
      appealNodes: Array<{ level: string; authority: string; scope: string; governingSection: string }>;
    } | undefined;

    const facts = Array.from(ctx.factRegistry.values());
    const admittedFacts = facts
      .filter((f) => f.assertionType === AssertionType.ADMITTED)
      .map((f) => f.proposition);
    const disputedFacts = facts
      .filter(
        (f) =>
          f.polarity === AssertionPolarity.DISPUTED ||
          f.assertionType === AssertionType.DENIED,
      )
      .map((f) => f.proposition);
    const unknownFacts = facts
      .filter((f) => f.truth === Tristate.UNKNOWN)
      .map((f) => ({
        category: f.predicate,
        factDescription: f.proposition,
        status: "AMBIGUOUS_ASSERTION" as const,
        recordSignificance: f.confidence === FactConfidence.CANDIDATE ? "Requires verification" : "Referenced",
      }));
    const quantumFacts = facts
      .filter((f) => f.predicate === "Quantum Amount" && f.normalizedValue != null)
      .map((f) => `${f.proposition} (${f.normalizedValue})`);

    // Build factsMeta
    const isRegisteredBainapatra = this.evaluateFact(ctx, "Bainapatra", "Registration Status", "REGISTERED").status === Tristate.TRUE
      ? true
      : this.evaluateFact(ctx, "Bainapatra", "Registration Status", "UNREGISTERED").status === Tristate.TRUE
        ? false
        : "unspecified" as const;
    const isBalanceDeposited = this.evaluateFact(ctx, "Treasury Deposit", "Payment Status", "DEPOSITED").status === Tristate.TRUE
      ? true
      : this.evaluateFact(ctx, "Treasury Deposit", "Payment Status", "NOT_DEPOSITED").status === Tristate.TRUE
        ? false
        : "unspecified" as const;
    const isAncestorDeceased = this.evaluateFact(ctx, "Ancestor", "Vital Status", "DECEASED").status === Tristate.TRUE;

    // Precedent audit
    const precedents = legislationData?.precedents ?? [];
    const verifiedCount = precedents.filter((p) => p.verificationStatus === "VERIFIED_CANONICAL").length;
    const rejectedCount = precedents.filter((p) => p.verificationStatus === "FAILED_UNVERIFIED").length;

    const response: CaseAnalysisResponse = {
      gateF0: f0Gate,
      stage0: {
        factualSummary: `Extracted ${facts.length} atomic fact(s) from input narrative for ${claimType} analysis.`,
        chronology: ctx.eventTimeline.map((e) => ({
          date: e.date ?? "UNKNOWN",
          event: e.type,
          partiesInvolved: "",
          factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
        })),
        admittedFacts,
        disputedFacts,
        unknownFacts,
        quantumFacts,
        factsMeta: {
          category: claimType,
          isRegisteredBainapatra,
          isBalanceDeposited,
          plaintiffHasRegisteredTitle: "unspecified",
          dispossessionProven: "unspecified",
        },
        atomicFacts: facts,
        propositions: Array.from(ctx.propositionRegistry.values()),
        assertions: Array.from(ctx.assertionRegistry.values()),
        contradictionGraph: ctx.contradictionGraph,
        eventTimeline: ctx.eventTimeline,
        provenance: facts.map((f) => ({
          factId: f.factId,
          sourceType: f.source.sourceType,
          extractionMethod: f.source.extractionMethod,
          validation: f.validation,
        })),
      },
      stage1: {
        primaryDomain: domainData?.primary ?? "UNKNOWN",
        subsidiaryDomains: domainData?.subsidiary ?? [],
        triggerFacts: [
          {
            domain: domainData?.primary ?? "UNKNOWN",
            fact: `Claim type: ${claimType}`,
            statutoryTrigger: claimType,
          },
        ],
      },
      stage2: {
        primaryAct: legislationData?.legislation.primaryAct ?? "N/A",
        relevantSections: legislationData?.legislation.relevantSections ?? [],
        precedents: precedents.map((p) => ({
          citation: p.citation,
          caseTitle: p.caseTitle,
          court: p.court,
          decisionYear: p.decisionYear,
          reporter: p.reporter,
          volume: p.volume,
          page: p.page,
          bench: p.bench,
          statutorySubject: p.statutorySubject,
          holding: p.holding,
          relevance: p.relevance,
          ratioDecidendi: p.ratioDecidendi,
          verificationStatus: p.verificationStatus as "VERIFIED_CANONICAL" | "FAILED_UNVERIFIED",
          verificationHash: p.verificationHash,
          isDeterministic: p.isDeterministic,
          securityHashToken: p.securityHashToken,
        })),
        citationValidationAudit: {
          totalCitations: precedents.length,
          verifiedCount,
          rejectedCount,
          validationStandard: "100% deterministic canonical registry verification",
          auditStatus: rejectedCount === 0
            ? ("PASS_100_PERCENT_DETERMINISTIC" as const)
            : ("FAIL_UNVERIFIED_DETECTED" as const),
          registrySignature: `BCCAA-CIT-AUDIT-${Date.now().toString(36)}`,
        },
        equityPrinciples: (equityData?.applicablePrinciples ?? []).map(
          (p) => `${p.principle}: ${p.application}`,
        ),
      },
      stage3: {
        accrualDate: limitationData?.accrualDate ?? "NOT_EXTRACTED",
        prescribedPeriod: limitationData?.prescribedPeriod ?? "N/A",
        limitationArticle: limitationData?.limitationArticle ?? "N/A",
        isTimeBarred: limitationData?.isTimeBarred ?? false,
        exceptionsOrExtensions: limitationData?.exceptionsOrExtensions ?? "",
        preliminaryAnalysis: limitationData?.preliminaryAnalysis ?? "Limitation could not be computed.",
        timelineValidation: limitationData?.timelineValidation
          ? {
              agreementDate: limitationData.timelineValidation.agreementDate,
              refusalDate: limitationData.timelineValidation.refusalDate,
              isAgreementDateExtracted: limitationData.timelineValidation.isAgreementDateExtracted,
              isRefusalDateExtracted: limitationData.timelineValidation.isRefusalDateExtracted,
              calculationType: limitationData.timelineValidation.calculationType as "real_refusal" | "heuristic_6_months" | "missing_dates" | "other_category",
              validationStatus: limitationData.timelineValidation.validationStatus as "valid" | "heuristic_applied" | "invalid_gaps",
              explanation: limitationData.timelineValidation.explanation,
            }
          : undefined,
      },
      stage4: {
        plaintiffs: standiData?.plaintiffs ?? [],
        defendants: standiData?.defendants ?? [],
        joinderIssues: standiData?.joinderIssues ?? "",
        locusStandiSummary: standiData?.locusStandiSummary ?? "Not determined.",
      },
      stage5: {
        territorial: procedureData?.territorial ?? {
          rule: "N/A",
          governingSection: "N/A",
          jurisdictionalFacts: "N/A",
        },
        pecuniary: procedureData?.pecuniary ?? {
          valuation: "N/A",
          courtLevel: "N/A",
          pecuniaryLimits: "N/A",
          suitsValuationActNotes: "N/A",
        },
        subjectMatter: procedureData?.subjectMatter ?? {
          isExcluded: false,
          forum: "Civil Court",
          governingStatute: "N/A",
        },
        objectionStrategy: procedureData?.objectionStrategy ?? "N/A",
      },
      stage6: {
        plaintChecklist: pleadingData?.plaintChecklist ?? [],
        groundsForRejection: pleadingData?.groundsForRejection ?? [],
        writtenStatementDeemedAdmissions: pleadingData?.writtenStatementDeemedAdmissions ?? "",
        counterclaimsOrSetOff: pleadingData?.counterclaimsOrSetOff ?? "",
      },
      stage7: {
        issues: issuesData?.issues ?? [],
      },
      stage8: {
        evidenceList: evidenceData?.evidenceList ?? [],
        burdenAssignments: evidenceData?.burdenAssignments ?? "",
        statutoryPresumptions: evidenceData?.statutoryPresumptions ?? [],
      },
      stage9: {
        issueDetails: meritsData?.issueDetails ?? [],
      },
      stage10: {
        applicablePrinciples: equityData?.applicablePrinciples ?? [],
        discretionaryReliefCheck: equityData?.discretionaryReliefCheck ?? "N/A",
      },
      stage11: {
        timelineProgress: procedureData?.timelineProgress ?? [],
      },
      stage12: {
        appealNodes: appealData?.appealNodes ?? [],
      },
      stage13: {
        overview: synthesis.conclusion,
        reliefDecree: synthesis.status === "ELEMENTS_SATISFIED"
          ? "Structural elements satisfied. Relief decree formulation requires court determination of quantum and specific terms."
          : synthesis.status === "FAILED"
            ? "Claim structurally unsustainable. No relief decree available."
            : "Indeterminate — cannot formulate relief decree.",
        costsApportionment: "To be determined by court based on outcome.",
        equitableBars: equityData?.discretionaryReliefCheck ?? "None detected.",
        executionPathway: synthesis.status === "ELEMENTS_SATISFIED"
          ? "If decree granted, execution under Order XXI CPC 1908."
          : "Not applicable — claim does not reach decree stage.",
      },
      _security: {
        analyzedBy: request.user.userId || request.user.email || "UNKNOWN",
        analyzedAt: Date.now(),
        licenseId: request.license.licenseId,
        forensicHash: "",
        engineVersion: ENGINE_MANIFEST.engineVersion,
        caseId: pipeline.caseId,
      },
    };

    // Compute and bind forensic hash
    response._security.forensicHash = this.computeOutputHash(response);

    return response;
  }

  private buildPreF0HaltResponse(
    ctx: ExecutionContext,
    caseId: string,
    haltReason: string,
    detail: string,
  ): CaseAnalysisResponse {
    const response: CaseAnalysisResponse = {
      stage0: {
        factualSummary: `Analysis halted before F0 gate: ${haltReason}. ${detail}`,
        chronology: ctx.eventTimeline.map((e) => ({
          date: e.date ?? "UNKNOWN",
          event: e.type,
          partiesInvolved: "",
          factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
        })),
        admittedFacts: [],
        disputedFacts: [],
        unknownFacts: [],
        quantumFacts: [],
      },
      stage1: { primaryDomain: "UNKNOWN", subsidiaryDomains: [], triggerFacts: [] },
      stage2: { primaryAct: "N/A", relevantSections: [], precedents: [], equityPrinciples: [] },
      stage3: { accrualDate: "N/A", prescribedPeriod: "N/A", limitationArticle: "N/A", isTimeBarred: false, exceptionsOrExtensions: "", preliminaryAnalysis: "Not executed." },
      stage4: { plaintiffs: [], defendants: [], joinderIssues: "", locusStandiSummary: "Not executed." },
      stage5: { territorial: { rule: "N/A", governingSection: "N/A", jurisdictionalFacts: "N/A" }, pecuniary: { valuation: "N/A", courtLevel: "N/A", pecuniaryLimits: "N/A", suitsValuationActNotes: "N/A" }, subjectMatter: { isExcluded: false, forum: "N/A", governingStatute: "N/A" }, objectionStrategy: "N/A" },
      stage6: { plaintChecklist: [], groundsForRejection: [], writtenStatementDeemedAdmissions: "", counterclaimsOrSetOff: "" },
      stage7: { issues: [] },
      stage8: { evidenceList: [], burdenAssignments: "", statutoryPresumptions: [] },
      stage9: { issueDetails: [] },
      stage10: { applicablePrinciples: [], discretionaryReliefCheck: "N/A" },
      stage11: { timelineProgress: [] },
      stage12: { appealNodes: [] },
      stage13: { overview: `HALTED: ${haltReason} — ${detail}`, reliefDecree: "Not applicable.", costsApportionment: "Not applicable.", equitableBars: "Not applicable.", executionPathway: "Not applicable." },
      _security: {
        analyzedBy: "SYSTEM",
        analyzedAt: Date.now(),
        licenseId: "",
        forensicHash: "",
        engineVersion: ENGINE_MANIFEST.engineVersion,
        caseId,
      },
    };
    response._security.forensicHash = this.computeOutputHash(response);
    return response;
  }

  private buildF0HaltResponse(
    ctx: ExecutionContext,
    request: AnalyzeRequest,
    claimType: ClaimType,
    f0Gate: FactConsistencyGateOutput,
    synthesis: SynthesisResult,
    caseId: string,
  ): CaseAnalysisResponse {
    const response: CaseAnalysisResponse = {
      gateF0: f0Gate,
      stage0: {
        factualSummary: `F0 GATE HALTED: ${f0Gate.summary}`,
        chronology: ctx.eventTimeline.map((e) => ({
          date: e.date ?? "UNKNOWN",
          event: e.type,
          partiesInvolved: "",
          factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
        })),
        admittedFacts: [],
        disputedFacts: f0Gate.conflicts.map((c) => c.description),
        unknownFacts: [],
        quantumFacts: [],
        atomicFacts: Array.from(ctx.factRegistry.values()),
        propositions: Array.from(ctx.propositionRegistry.values()),
        assertions: Array.from(ctx.assertionRegistry.values()),
        contradictionGraph: ctx.contradictionGraph,
        eventTimeline: ctx.eventTimeline,
      },
      stage1: { primaryDomain: "UNKNOWN", subsidiaryDomains: [], triggerFacts: [] },
      stage2: { primaryAct: "N/A", relevantSections: [], precedents: [], equityPrinciples: [] },
      stage3: { accrualDate: "N/A", prescribedPeriod: "N/A", limitationArticle: "N/A", isTimeBarred: false, exceptionsOrExtensions: "", preliminaryAnalysis: "Not executed — F0 halted." },
      stage4: { plaintiffs: [], defendants: [], joinderIssues: "", locusStandiSummary: "Not executed — F0 halted." },
      stage5: { territorial: { rule: "N/A", governingSection: "N/A", jurisdictionalFacts: "N/A" }, pecuniary: { valuation: "N/A", courtLevel: "N/A", pecuniaryLimits: "N/A", suitsValuationActNotes: "N/A" }, subjectMatter: { isExcluded: false, forum: "N/A", governingStatute: "N/A" }, objectionStrategy: "N/A" },
      stage6: { plaintChecklist: [], groundsForRejection: [], writtenStatementDeemedAdmissions: "", counterclaimsOrSetOff: "" },
      stage7: { issues: [] },
      stage8: { evidenceList: [], burdenAssignments: "", statutoryPresumptions: [] },
      stage9: { issueDetails: [] },
      stage10: { applicablePrinciples: [], discretionaryReliefCheck: "N/A" },
      stage11: { timelineProgress: [] },
      stage12: { appealNodes: [] },
      stage13: {
        overview: synthesis.conclusion,
        reliefDecree: "Not applicable — F0 halted.",
        costsApportionment: "Not applicable.",
        equitableBars: "Not applicable.",
        executionPathway: "Not applicable.",
      },
      _security: {
        analyzedBy: request.user.userId || request.user.email || "UNKNOWN",
        analyzedAt: Date.now(),
        licenseId: request.license.licenseId,
        forensicHash: "",
        engineVersion: ENGINE_MANIFEST.engineVersion,
        caseId,
      },
    };
    response._security.forensicHash = this.computeOutputHash(response);
    return response;
  }

  // ========================================================================
  // FIX #9: AUDIT PERSISTENCE — hash bound to chain record
  // ========================================================================

  private async persistAudit(
    ctx: ExecutionContext,
    request: AnalyzeRequest,
    caseId: string,
    startTime: number,
    outcome: ExecutionOutcome,
    outputHash: string,
  ): Promise<AuditRecord | null> {
    try {
      const rawInputHash = canonicalHash(request.input.factPattern);
      const facts = Array.from(ctx.factRegistry.values());
      const factRegistryHash = canonicalHash(
        facts.map((f) => ({
          id: f.factId,
          s: f.subject,
          p: f.predicate,
          o: f.object,
          t: f.truth,
          v: f.validationStatus,
        })),
      );
      const timelineHash = canonicalHash(ctx.eventTimeline);
      const traceHash = canonicalHash(ctx.executionTrace);

      // FIX #9: Bind execution environment explicitly into forensic hash
      const forensicInputHash = computeForensicHash({
        envelope: {
          caseId,
          claimType: this.resolveClaimType(request.input.factPattern, request.input.focusDomain),
          factCount: facts.length,
        },
        corpusIdentity: this.ruleRegistry.identity,
        ruleGraphIdentity: this.ruleRegistry.identity,
        engineVersion: ENGINE_MANIFEST.engineVersion,
        corpusMode: ENGINE_MANIFEST.corpusMode,
      });

      const payload: AuditRecordPayload = {
        caseId,
        rawInputHash,
        extractionHash: factRegistryHash,
        inputHash: rawInputHash,
        factRegistryHash,
        timelineHash,
        eventTimelineHash: timelineHash,
        corpusIdentity: this.ruleRegistry.identity,
        corpusDigest: this.ruleRegistry.identity.corpusDigest,
        ruleRegistryVersion: this.ruleRegistry.version,
        ruleRegistryHash: canonicalHash(this.ruleRegistry.identity),
        executionTraceHash: traceHash,
        outputHash,
        forensicInputHash,
        manifest: ENGINE_MANIFEST,
        executionMilliseconds: Date.now() - startTime,
        analyzedByUserId: request.user.userId || request.user.email || "UNKNOWN",
        outcome,
      };

      // FIX #9: append() returns the chain record with previousHash and recordHash
      const record = await this.auditSink.append(payload);

      recordTrace(ctx, {
        layer: "P2_SYNTHESIS",
        description: `Audit record persisted. recordHash=${record.recordHash.slice(0, 16)}... previousHash=${record.previousHash?.slice(0, 16) ?? "NULL"}...`,
        dependsOnFacts: [],
        dependsOnRules: [],
        result: "AUDIT_PERSISTED",
      });

      return record;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      ctx.warnings.push(`AUDIT_PERSIST_FAILED: ${msg}`);
      return null;
    }
  }

  private computeOutputHash(response: CaseAnalysisResponse): string {
    // Hash the structural content (exclude _security.forensicHash itself to avoid circularity)
    const { _security, ...rest } = response;
    return canonicalHash({
      ...rest,
      _securityAnalyzedBy: _security?.analyzedBy,
      _securityAnalyzedAt: _security?.analyzedAt,
      _securityEngineVersion: _security?.engineVersion,
      _securityCaseId: _security?.caseId,
    });
  }

  // ========================================================================
  // INTERNAL HELPERS
  // ========================================================================

  private findDateFact(
    facts: AtomicFact[],
    subject: string,
    predicate: string,
    objectFilter?: string,
  ): string | null {
    const match = facts.find(
      (f) =>
        f.subject.toUpperCase() === subject.toUpperCase() &&
        f.predicate.toUpperCase() === predicate.toUpperCase() &&
        (objectFilter === undefined ||
          f.object?.toUpperCase() === objectFilter.toUpperCase()) &&
        f.eventDate &&
        isStrictDate(f.eventDate),
    );
    return match?.eventDate ?? null;
  }

  private getConflictModeFromFacts(
    ctx: ExecutionContext,
    subject: string,
    predicate: string,
  ): PredicateConflictMode {
    return getConflictMode(ctx, subject, predicate);
  }

  private rp_authorityIds(rule: LegalRule): string[] {
    const ids: string[] = [];
    for (const p of rule.predicates) {
      if (p.authorityIds) ids.push(...p.authorityIds);
    }
    if (rule.authority.authorityId) ids.push(rule.authority.authorityId);
    return [...new Set(ids)];
  }
