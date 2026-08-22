// src/engine/BCCAAEngine.ts
// BCCAA 4.4.0-Hardened
//
// Design target:
//   FACT -> PROPOSITION -> ASSERTION -> VALIDATION -> RULE PREDICATE
//   -> LOGICAL OPERATOR -> RULE RESULT -> LEGAL CONCLUSION -> AUDIT
//
// IMPORTANT: this engine does not manufacture validated law. Production
// authority must be supplied through a validated RuleRegistry/CorpusProvider.

import { CaseAnalysisResponse, EngineInput, FactConsistencyGateOutput } from "../types/types";
import { AuthUser } from "../types/auth.types";
import { generateSecureId, generateHash } from "../utils/crypto";
import { CitationValidator } from "./CitationValidator";
import { FactConsistencyGate } from "./FactConsistencyGate";

// ============================================================================
// MANIFEST / HARD LIMITS
// ============================================================================

export const ENGINE_MANIFEST = Object.freeze({
  engineVersion: "4.4.0-Hardened",
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
  auditMode: "ATOMIC_APPEND_REQUIRED" as "ATOMIC_APPEND_REQUIRED" | "DEVELOPMENT",
});

const MAX_INPUT_LENGTH = 100_000;

// ============================================================================
// ENUMS
// ============================================================================

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
  sourceType?: "INPUT_NARRATIVE" | "PLEADING" | "DOCUMENT" | "ORDER" | "JUDGMENT" | "OTHER";
  extractionMethod?: "PATTERN" | "STRUCTURED_INPUT" | "MANUAL_VALIDATION" | "DOCUMENT_VALIDATION";
}

export type FactSource = SourceSpan;

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
// AUTHORITY / RULE GRAPH
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
    primaryAct: string;
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

interface LegalEvent {
  eventId: string;
  type: string;
  date: string | null;
  datePrecision: "EXACT" | "MONTH" | "YEAR" | "UNKNOWN";
  sourceFactIds: string[];
}

interface ExecutionTraceStep {
  stepId: string;
  layer: "P0_EXTRACTION" | "F0_GATE" | "P1_RULE" | "P1_ELEMENT_GATE" | "P1_TEMPORAL" | "P1_VALUATION" | "P1_EVIDENCE" | "P2_SYNTHESIS" | "SYSTEM_ERROR";
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
}

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
  };
}

function recordTrace(ctx: ExecutionContext, step: Omit<ExecutionTraceStep, "stepId">): void {
  const stepId = `TRACE-${String(ctx.executionTrace.length + 1).padStart(5, "0")}`;
  ctx.executionTrace.push({ stepId, ...step });
}

// ============================================================================
// ONE CANONICAL SERIALIZATION / HASH PATH
// ============================================================================

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function canonicalHash(value: unknown): string {
  return generateHash(canonicalStringify(value));
}

// ============================================================================
// CORPUS / AUDIT / LICENSE INTERFACES
// ============================================================================

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
  manifest: typeof ENGINE_MANIFEST;
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
// DEVELOPMENT IMPLEMENTATIONS — NEVER VALIDATED PRODUCTION AUTHORITY
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

  getClaimElements(claimType: ClaimType, jurisdiction: string): LegalRule[] {
    if (claimType === "SPECIFIC_PERFORMANCE") {
      return [
        {
          ruleId: "SP-ELEMENT-REGISTRATION", ruleVersion: "1.0.0", jurisdiction,
          effectiveFrom: "1900-01-01", claimTypes: [claimType], ruleType: "ELEMENT", logicalOperator: "ALL",
          predicates: [{ predicateId: "SP-P1", subject: "Bainapatra", predicate: "Registration Status", object: "REGISTERED", requiredTruth: Tristate.TRUE, requireVerified: true }],
          outcomeIfSatisfied: "REGISTRATION_ELEMENT_SATISFIED", outcomeIfFailed: "REGISTRATION_ELEMENT_FAILED",
          authority: { act: "Applicable specific-performance law", section: "Registry-controlled" }, priority: 1,
        },
        {
          ruleId: "SP-ELEMENT-DEPOSIT", ruleVersion: "1.0.0", jurisdiction,
          effectiveFrom: "1900-01-01", claimTypes: [claimType], ruleType: "ELEMENT", logicalOperator: "ALL",
          predicates: [{ predicateId: "SP-P2", subject: "Treasury Deposit", predicate: "Payment Status", object: "DEPOSITED", requiredTruth: Tristate.TRUE, requireVerified: true }],
          outcomeIfSatisfied: "DEPOSIT_ELEMENT_SATISFIED", outcomeIfFailed: "DEPOSIT_ELEMENT_FAILED",
          authority: { act: "Applicable specific-performance law", section: "Registry-controlled" }, priority: 2,
        },
      ];
    }
    if (claimType === "INHERITANCE_CONSULTATION") {
      return [{
        ruleId: "SUCCESSION-DEATH-ELEMENT", ruleVersion: "1.0.0", jurisdiction,
        effectiveFrom: "1900-01-01", claimTypes: [claimType], ruleType: "ELEMENT", logicalOperator: "ALL",
        predicates: [{ predicateId: "SUCC-P1", subject: "Ancestor", predicate: "Vital Status", object: "DECEASED", requiredTruth: Tristate.TRUE, requireVerified: true }],
        outcomeIfSatisfied: "SUCCESSION_OPENED", outcomeIfFailed: "SUCCESSION_NOT_ESTABLISHED",
        authority: { act: "Applicable succession law", section: "Registry-controlled" }, priority: 1,
      }];
    }
    return [];
  }

  getLegislationMapping(claimType: ClaimType) {
    if (claimType === "SPECIFIC_PERFORMANCE" || claimType === "DECLARATION_AND_POSSESSION") {
      return { primaryAct: "Specific Relief Act 1877", relevantSections: [{ actName: "Specific Relief Act 1877", sectionOrRule: "Registry-controlled", purpose: "Claim-specific analysis" }] };
    }
    if (claimType === "INHERITANCE_CONSULTATION") return { primaryAct: "Applicable succession / personal law", relevantSections: [] };
    return { primaryAct: "N/A", relevantSections: [] };
  }
}

/** @deprecated Fixture alias retained only for source compatibility. */
export class DefaultRuleRegistry extends DevelopmentRuleRegistry {
  constructor() {
    super();
    console.warn("[DefaultRuleRegistry] Deprecated fixture alias; not validated law.");
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
    console.warn("[DefaultAuditSink] Development-only, non-durable audit sink.");
    return record;
  }
}

export class DefaultLicenseValidator implements LicenseValidator {
  readonly isProductionReady = false;
  async validate(_user: AuthUser, license: { licenseId: string; issuedTo: string }) {
    if (!license?.licenseId || !license?.issuedTo) return { valid: false, reason: "License object incomplete." };
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

  constructor(deps?: {
    ruleRegistry?: RuleRegistry;
    auditSink?: AuditSink;
    licenseValidator?: LicenseValidator;
    factValidationProvider?: FactValidationProvider;
  }) {
    this.ruleRegistry = deps?.ruleRegistry ?? new DevelopmentRuleRegistry();
    this.auditSink = deps?.auditSink ?? new DefaultAuditSink();
    this.licenseValidator = deps?.licenseValidator ?? new DefaultLicenseValidator();
    this.factValidationProvider = deps?.factValidationProvider ?? new NoOpFactValidationProvider();
    this.assertConfiguration();
  }

  private assertConfiguration(): void {
    if (ENGINE_MANIFEST.corpusMode === "VALIDATED_PRODUCTION") {
      if (this.ruleRegistry.version.startsWith("DEVELOPMENT-FIXTURE") || this.ruleRegistry.identity.corpusDigest.startsWith("DEVELOPMENT")) {
        throw new Error("FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a validated production corpus.");
      }
      if (this.auditSink instanceof DefaultAuditSink || (this.auditSink as { isProductionReady?: boolean }).isProductionReady === false) {
        throw new Error("FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a durable concurrency-safe AuditSink.");
      }
      if (this.licenseValidator instanceof DefaultLicenseValidator || this.licenseValidator.isProductionReady === false) {
        throw new Error("FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a production LicenseValidator.");
      }
      if (this.factValidationProvider instanceof NoOpFactValidationProvider || this.factValidationProvider.isProductionReady === false) {
        throw new Error("FATAL CONFIGURATION ERROR: VALIDATED_PRODUCTION requires a production FactValidationProvider.");
      }
    }
  }

  async analyze(request: AnalyzeRequest): Promise<CaseAnalysisResponse> {
    const startTime = Date.now();
    const caseId = `BCCAA-4.4-${Date.now()}-${generateSecureId().slice(0, 8)}`;
    const ctx = newContext();

    try {
      const license = await this.licenseValidator.validate(request.user, request.license);
      if (!license.valid) return this.buildHaltResponse(ctx, caseId, `LICENSE_DENIED: ${license.reason ?? "unspecified"}`);
      if (!request.input?.factPattern) return this.buildHaltResponse(ctx, caseId, "EMPTY_INPUT: factPattern is required.");
      if (request.input.factPattern.length > MAX_INPUT_LENGTH) return this.buildHaltResponse(ctx, caseId, `INPUT_TOO_LARGE: maximum ${MAX_INPUT_LENGTH} characters.`);
      return await this.runPipeline(ctx, request, caseId, startTime);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      recordTrace(ctx, { layer: "SYSTEM_ERROR", description: "Uncaught execution error.", dependsOnFacts: [], dependsOnRules: [], result: message });
      const response = this.buildHaltResponse(ctx, caseId, `SYSTEM_ERROR: ${message}`);
      await this.persistAudit(ctx, request, caseId, startTime, "ERROR", this.computeOutputHash(response)).catch(() => undefined);
      return response;
    }
  }

  private async runPipeline(ctx: ExecutionContext, request: AnalyzeRequest, caseId: string, startTime: number): Promise<CaseAnalysisResponse> {
    const { input } = request;
    const claimType = this.resolveClaimType(input.factPattern, input.focusDomain);

    this.extractAtomicFacts(ctx, input.factPattern, claimType);
    await this.applyFactValidation(ctx);
    this.buildContradictionGraph(ctx);
    this.buildEventTimeline(ctx);

    // CRITICAL F0: verified TRUE + verified FALSE for the same proposition
    // is never downgraded to UNKNOWN and never allowed into P1.
    const conflict = this.findCriticalConflict(ctx);
    if (conflict) {
      recordTrace(ctx, { layer: "F0_GATE", description: "Verified direct truth conflict detected.", dependsOnFacts: [conflict.leftFactId, conflict.rightFactId], dependsOnRules: [], result: "HALT_CRITICAL_CONFLICT" });
      const f0Gate = { gateStatus: "HALT_CRITICAL_CONFLICT", details: `CRITICAL_CONFLICT: ${conflict.propositionKey}` } as unknown as FactConsistencyGateOutput;
      const synthesis = this.executeFailClosedSynthesis(ctx, f0Gate, claimType, { status: GateStatus.HALT, allSatisfied: false, missingElements: [], unknownElements: [], fatalFailures: ["CRITICAL_CONFLICT"], ruleExecutionResults: [] });
      const response = this.buildResponse(ctx, request, claimType, f0Gate, synthesis, { halted: true, caseId });
      await this.persistAudit(ctx, request, caseId, startTime, "HALTED", this.computeOutputHash(response));
      return response;
    }

    const chronology = ctx.eventTimeline.map((e) => ({ event: e.type, date: e.date }));
    const ancestorDeceased = this.evaluateFact(ctx, "Ancestor", "Vital Status", "DECEASED", { requireVerified: false }).status;
    const f0Gate = FactConsistencyGate.evaluate(input.factPattern, chronology, claimType, ancestorDeceased === Tristate.TRUE);
    recordTrace(ctx, { layer: "F0_GATE", description: "Fact Consistency Gate executed.", dependsOnFacts: this.getAllFactIds(ctx), dependsOnRules: [], result: f0Gate.gateStatus });

    if (f0Gate.gateStatus === "HALT_CRITICAL_CONFLICT") {
      const synthesis = this.executeFailClosedSynthesis(ctx, f0Gate, claimType, { status: GateStatus.HALT, allSatisfied: false, missingElements: [], unknownElements: [], fatalFailures: ["F0_CRITICAL_CONFLICT"], ruleExecutionResults: [] });
      const response = this.buildResponse(ctx, request, claimType, f0Gate, synthesis, { halted: true, caseId });
      await this.persistAudit(ctx, request, caseId, startTime, "HALTED", this.computeOutputHash(response));
      return response;
    }

    // P1 begins only after F0 has passed without a critical halt.
    const domain = this.classifyDomain(ctx, claimType);
    const legislation = this.mapLegislation(claimType);
    const limitation = this.executeLimitationEngine(ctx);
    const elementGate = this.executeElementCompletenessGate(ctx, claimType);
    const jurisdiction = this.executeJurisdictionEngine(ctx);
    const standi = this.executePartyStandiRules(ctx, claimType);
    const pleading = this.executePleadingRules(elementGate);
    const issues = this.executeIssueFramingRules(ctx, elementGate);
    const evidence = this.executeEvidenceRules(ctx);
    const merits = this.executeMeritRules(elementGate);
    const equity = this.executeEquityRules(elementGate);
    const procedure = this.executeProcedureRules();
    const appeal = this.executeAppealRules();
    const synthesis = this.executeFailClosedSynthesis(ctx, f0Gate, claimType, elementGate);

    const response = this.buildResponse(ctx, request, claimType, f0Gate, synthesis, {
      caseId, domain, legislation, limitation, standi, jurisdiction, pleading, issues, evidence, merits, equity, procedure, appeal,
    });
    const outcome: AuditRecordPayload["outcome"] = elementGate.status === GateStatus.PASS ? "SUCCESS" : "INDETERMINATE";
    await this.persistAudit(ctx, request, caseId, startTime, outcome, this.computeOutputHash(response));
    return response;
  }

  // ========================================================================
  // P0 EXTRACTION -> PROPOSITION -> ASSERTION
  // ========================================================================

  private extractAtomicFacts(ctx: ExecutionContext, rawText: string, claimType: ClaimType): void {
    const sentences = this.segmentDocument(rawText);
    for (let index = 0; index < sentences.length; index++) {
      const sentence = sentences[index];
      for (const clause of this.segmentClauses(sentence)) {
        const candidates = this.extractClauseFacts(clause);
        if (!candidates.length) continue;
        const assertionContext = this.detectAssertionContext(clause);
        const assertedBy = this.detectAssertingParty(clause);

        for (const candidate of candidates) {
          const propositionId = this.ensureProposition(ctx, candidate.subject, candidate.predicate, candidate.object, clause);
          const assertionId = `A${String(ctx.assertionCounter++).padStart(5, "0")}`;
          const assertionType = assertionContext.type;
          const polarity = assertionContext.polarity;
          const truth = assertionType === AssertionType.ADMITTED && polarity === AssertionPolarity.POSITIVE
            ? Tristate.UNKNOWN
            : assertionType === AssertionType.DENIED || polarity === AssertionPolarity.NEGATIVE || polarity === AssertionPolarity.DISPUTED
            ? Tristate.UNKNOWN
            : Tristate.UNKNOWN;

          const source: SourceSpan = {
            documentId: "INPUT_NARRATIVE", segment: clause, paragraph: index + 1,
            sourceType: "INPUT_NARRATIVE", extractionMethod: "PATTERN",
          };
          ctx.assertionRegistry.set(assertionId, { assertionId, propositionId, assertionType, polarity, truth, assertedBy: assertedBy ?? undefined, sourceSpan: source });

          const factId = `F${String(ctx.factCounter++).padStart(5, "0")}`;
          const fact: AtomicFact = {
            factId, propositionId, assertionId, proposition: clause,
            subject: candidate.subject, predicate: candidate.predicate, object: candidate.object,
            truth, polarity, source, assertionType, validationStatus: ValidationStatus.UNVERIFIED,
            confidence: FactConfidence.CANDIDATE, assertedBy: assertedBy ?? undefined,
            eventDate: candidate.eventDate ?? null, normalizedValue: candidate.normalizedValue ?? null,
            disputedProposition: assertionType === AssertionType.DENIED || polarity === AssertionPolarity.DISPUTED ? clause : undefined,
            validation: {
              extractionStatus: ExtractionStatus.EXTRACTED,
              sourceStatus: SourceStatus.IDENTIFIED,
              authenticationStatus: AuthenticationStatus.UNAUTHENTICATED,
              corroborationStatus: CorroborationStatus.UNCORROBORATED,
              humanValidationStatus: HumanValidationStatus.NOT_VALIDATED,
            },
          };
          ctx.factRegistry.set(factId, fact);
          recordTrace(ctx, { layer: "P0_EXTRACTION", description: `FACT -> PROPOSITION -> ASSERTION: ${factId}`, dependsOnFacts: [], dependsOnRules: [], result: `${factId}:${propositionId}:${assertionId}` });
        }
      }
    }
    this.ensureClaimRelevantUnknowns(ctx, claimType);
  }

  private ensureProposition(ctx: ExecutionContext, subject: string, predicate: string, object: string | null, text: string): string {
    const canonicalKey = `${subject}|${predicate}|${object ?? "*"}`.toUpperCase();
    const existing = Array.from(ctx.propositionRegistry.values()).find((p) => p.canonicalKey === canonicalKey);
    if (existing) return existing.propositionId;
    const propositionId = `P${String(ctx.propositionCounter++).padStart(5, "0")}`;
    ctx.propositionRegistry.set(propositionId, { propositionId, subject, predicate, object, canonicalKey, text });
    return propositionId;
  }

  private async applyFactValidation(ctx: ExecutionContext): Promise<void> {
    const validated = await this.factValidationProvider.validateFacts({
      facts: Array.from(ctx.factRegistry.values()),
      propositions: Array.from(ctx.propositionRegistry.values()),
      assertions: Array.from(ctx.assertionRegistry.values()),
    });
    if (validated.length !== ctx.factRegistry.size) throw new Error("FACT_VALIDATION_INTEGRITY_ERROR: validator changed fact cardinality.");
    for (const fact of validated) {
      if (!ctx.factRegistry.has(fact.factId)) throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: unknown fact ${fact.factId}.`);
      ctx.factRegistry.set(fact.factId, fact);
    }
  }

  private segmentDocument(rawText: string): string[] {
    return rawText.replace(/\r\n/g, "\n").split(/(?<=[.!?])\s+|\n+/g).map((x) => x.trim()).filter(Boolean);
  }

  private segmentClauses(sentence: string): string[] {
    // Deliberately does NOT split on the adjective "unregistered" or other
    // lexical negators. A semantic polarity detector must inspect the clause.
    return sentence.split(/\s*(?:;|\bbut\b|\balthough\b|\bhowever\b|\bwhereas\b|\bwhile\b)\s*/i).map((x) => x.trim()).filter(Boolean);
  }

  private detectAssertionContext(clause: string): { type: AssertionType; polarity: AssertionPolarity } {
    const lower = this.normalizeText(clause);
    if (/\b(defendant|plaintiff)\b[^.!?]{0,80}\b(?:denies?|disputes?|refutes?)\b/i.test(clause)) return { type: AssertionType.DENIED, polarity: AssertionPolarity.DISPUTED };
    if (/\b(?:denies?|disputes?|refutes?)\b[^.!?]{0,80}\b(defendant|plaintiff)\b/i.test(clause)) return { type: AssertionType.DENIED, polarity: AssertionPolarity.DISPUTED };
    if (/\b(?:admits?|admitted|concedes?|conceded|acknowledges?)\b/i.test(clause)) return { type: AssertionType.ADMITTED, polarity: AssertionPolarity.POSITIVE };
    if (/\b(?:not|never|no)\b/i.test(lower)) return { type: AssertionType.ALLEGED, polarity: AssertionPolarity.NEGATIVE };
    return { type: AssertionType.ALLEGED, polarity: AssertionPolarity.POSITIVE };
  }

  private detectAssertingParty(clause: string): string | null {
    const plaintiff = /\bplaintiff\b[^.!?]{0,40}\b(?:denies?|disputes?|admits?|alleges?|asserts?|claims?|concedes?)\b/i.test(clause);
    const defendant = /\bdefendant\b[^.!?]{0,40}\b(?:denies?|disputes?|admits?|alleges?|asserts?|claims?|concedes?)\b/i.test(clause);
    if (plaintiff !== defendant) return plaintiff ? "PLAINTIFF" : "DEFENDANT";
    return null;
  }

  private extractClauseFacts(clause: string): Array<{ subject: string; predicate: string; object: string | null; eventDate?: string | null; normalizedValue?: string | number | boolean }> {
    const facts: Array<{ subject: string; predicate: string; object: string | null; eventDate?: string | null; normalizedValue?: string | number | boolean }> = [];
    const lower = this.normalizeText(clause);

    const death = /\b(?:died|demise|passed away|deceased)\b(?:\s+(?:on|at)\s+)?(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})?/i.exec(clause);
    if (death) facts.push({ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED", eventDate: death[1] ?? null });
    if (/\b(?:alive|living|still alive)\b/i.test(lower)) facts.push({ subject: "Ancestor", predicate: "Vital Status", object: "ALIVE" });

    // "unregistered" is a VALUE of Registration Status, not a denial marker.
    if (/\bunregistered\s+(?:bainapatra|agreement(?:\s+to\s+sell)?)\b/i.test(clause)) facts.push({ subject: "Bainapatra", predicate: "Registration Status", object: "UNREGISTERED" });
    if (/\bregistered\s+(?:bainapatra|agreement(?:\s+to\s+sell)?)\b/i.test(clause) && !/\bunregistered\s+(?:bainapatra|agreement(?:\s+to\s+sell)?)\b/i.test(clause)) facts.push({ subject: "Bainapatra", predicate: "Registration Status", object: "REGISTERED" });

    if (/\b(?:deposited|deposit)\b.*\b(?:balance|consideration|money)\b.*\b(?:court|treasury|challan)\b/i.test(clause)) facts.push({ subject: "Treasury Deposit", predicate: "Payment Status", object: "DEPOSITED" });
    if (/\b(?:not deposited|failed to deposit|did not deposit|no deposit)\b/i.test(lower)) facts.push({ subject: "Treasury Deposit", predicate: "Payment Status", object: "NOT_DEPOSITED" });

    if (/\b(?:registered title|registered sale deed|kabala)\b/i.test(lower) && !/\b(?:no registered title|unregistered title|lacks registered title)\b/i.test(lower)) facts.push({ subject: "Plaintiff", predicate: "Registered Title", object: "REGISTERED" });
    if (/\b(?:no registered title|unregistered title|lacks registered title)\b/i.test(lower)) facts.push({ subject: "Plaintiff", predicate: "Registered Title", object: "NOT_REGISTERED" });
    if (/\b(?:dispossessed|ousted|ouster)\b/i.test(lower) && !/\b(?:not dispossessed|no dispossession)\b/i.test(lower)) facts.push({ subject: "Plaintiff", predicate: "Dispossession", object: "PROVEN_ALLEGED" });
    if (/\b(?:not dispossessed|no dispossession)\b/i.test(lower)) facts.push({ subject: "Plaintiff", predicate: "Dispossession", object: "NONE" });

    for (const money of clause.match(/(?:BDT|Tk\.?|Taka)\s*[\d,]+(?:\.\d{1,2})?/gi) ?? []) {
      const amount = this.parseMoney(money);
      if (amount !== null) facts.push({ subject: "Case", predicate: "Monetary Amount", object: "BDT", normalizedValue: amount });
    }

    const location = /(?:mouza|village|upazila|thana|district)\s*[:\-]?\s*([A-Za-z\u0980-\u09FF][A-Za-z\u0980-\u09FF\s\-]*)/i.exec(clause);
    if (location) facts.push({ subject: "Property", predicate: "Location", object: location[1].trim(), normalizedValue: location[1].trim() });
    return facts;
  }

  private ensureClaimRelevantUnknowns(ctx: ExecutionContext, claimType: ClaimType): void {
    const add = (subject: string, predicate: string, object: string) => {
      if (this.getFacts(ctx, subject, predicate).length) return;
      const propositionId = this.ensureProposition(ctx, subject, predicate, object, `${subject} ${predicate}: UNKNOWN`);
      const assertionId = `A${String(ctx.assertionCounter++).padStart(5, "0")}`;
      const source: SourceSpan = { documentId: "ENGINE_UNKNOWN", segment: "No supporting fact supplied.", sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" };
      ctx.assertionRegistry.set(assertionId, { assertionId, propositionId, assertionType: AssertionType.INFERRED, polarity: AssertionPolarity.UNKNOWN, truth: Tristate.UNKNOWN, sourceSpan: source });
      const factId = `FUNK-${generateSecureId().slice(0, 8)}`;
      ctx.factRegistry.set(factId, { factId, propositionId, assertionId, proposition: `${subject} ${predicate} ${object}: UNKNOWN`, subject, predicate, object, truth: Tristate.UNKNOWN, polarity: AssertionPolarity.UNKNOWN, source, assertionType: AssertionType.INFERRED, validationStatus: ValidationStatus.UNVERIFIED, confidence: FactConfidence.CANDIDATE, validation: { extractionStatus: ExtractionStatus.NOT_EXECUTED, sourceStatus: SourceStatus.UNRESOLVED, authenticationStatus: AuthenticationStatus.NOT_EXECUTED, corroborationStatus: CorroborationStatus.NOT_EXECUTED, humanValidationStatus: HumanValidationStatus.NOT_EXECUTED } });
    };
    if (claimType === "SPECIFIC_PERFORMANCE") { add("Bainapatra", "Registration Status", "REGISTERED"); add("Treasury Deposit", "Payment Status", "DEPOSITED"); }
    if (claimType === "INHERITANCE_CONSULTATION") add("Ancestor", "Vital Status", "DECEASED");
  }

  // ========================================================================
  // CONTRADICTION GRAPH / TRUTH EVALUATION
  // ========================================================================

  private propositionFamilyKey(fact: AtomicFact): string { return `${fact.subject}|${fact.predicate}`.toUpperCase(); }

  private buildContradictionGraph(ctx: ExecutionContext): void {
    ctx.contradictionGraph = [];
    const facts = Array.from(ctx.factRegistry.values());
    for (let i = 0; i < facts.length; i++) {
      for (let j = i + 1; j < facts.length; j++) {
        const a = facts[i], b = facts[j];
        if (this.propositionFamilyKey(a) !== this.propositionFamilyKey(b)) continue;
        if (a.truth === Tristate.UNKNOWN || b.truth === Tristate.UNKNOWN || a.truth === b.truth) continue;
        // A TRUE and FALSE assertion about the same subject/predicate is a
        // direct logical conflict even when object labels differ (REGISTERED
        // vs UNREGISTERED, DECEASED vs ALIVE, etc.).
        const edge: ContradictionEdge = {
          edgeId: `CE-${ctx.contradictionGraph.length + 1}`,
          propositionKey: this.propositionFamilyKey(a), leftFactId: a.factId, rightFactId: b.factId,
          relation: "DIRECT_TRUTH_CONFLICT",
          status: a.validationStatus === ValidationStatus.VERIFIED && b.validationStatus === ValidationStatus.VERIFIED ? "CRITICAL" : "PENDING_VALIDATION",
        };
        ctx.contradictionGraph.push(edge);
        a.contradicts = [...new Set([...(a.contradicts ?? []), b.factId])];
        b.contradicts = [...new Set([...(b.contradicts ?? []), a.factId])];
      }
    }
  }

  private findCriticalConflict(ctx: ExecutionContext): ContradictionEdge | null {
    return ctx.contradictionGraph.find((e) => e.status === "CRITICAL") ?? null;
  }

  private evaluateFact(ctx: ExecutionContext, subject: string, predicate: string, object: string | undefined, opts: { requireVerified: boolean }): { status: Tristate; supportingFactIds: string[]; contradictingFactIds: string[]; unverifiedFactIds: string[] } {
    const family = this.getFacts(ctx, subject, predicate);
    const matching = family.filter((f) => object === undefined || f.object === object);
    const trueFacts = matching.filter((f) => f.truth === Tristate.TRUE);
    const falseFacts = matching.filter((f) => f.truth === Tristate.FALSE);

    if (opts.requireVerified) {
      const verifiedTrue = trueFacts.filter((f) => f.validationStatus === ValidationStatus.VERIFIED);
      const verifiedFalse = falseFacts.filter((f) => f.validationStatus === ValidationStatus.VERIFIED);
      if (verifiedTrue.length && verifiedFalse.length) throw new Error(`CRITICAL_CONFLICT: ${subject}/${predicate}`);
      if (verifiedTrue.length) return { status: Tristate.TRUE, supportingFactIds: verifiedTrue.map((f) => f.factId), contradictingFactIds: [], unverifiedFactIds: trueFacts.filter((f) => f.validationStatus !== ValidationStatus.VERIFIED).map((f) => f.factId) };
      if (verifiedFalse.length) return { status: Tristate.FALSE, supportingFactIds: [], contradictingFactIds: verifiedFalse.map((f) => f.factId), unverifiedFactIds: falseFacts.filter((f) => f.validationStatus !== ValidationStatus.VERIFIED).map((f) => f.factId) };
      return { status: Tristate.UNKNOWN, supportingFactIds: [], contradictingFactIds: [], unverifiedFactIds: [...trueFacts, ...falseFacts].map((f) => f.factId) };
    }
    if (trueFacts.length && falseFacts.length && trueFacts.some((f) => f.validationStatus === ValidationStatus.VERIFIED) && falseFacts.some((f) => f.validationStatus === ValidationStatus.VERIFIED)) throw new Error(`CRITICAL_CONFLICT: ${subject}/${predicate}`);
    if (trueFacts.length && !falseFacts.length) return { status: Tristate.TRUE, supportingFactIds: trueFacts.map((f) => f.factId), contradictingFactIds: [], unverifiedFactIds: trueFacts.filter((f) => f.validationStatus !== ValidationStatus.VERIFIED).map((f) => f.factId) };
    if (falseFacts.length && !trueFacts.length) return { status: Tristate.FALSE, supportingFactIds: [], contradictingFactIds: falseFacts.map((f) => f.factId), unverifiedFactIds: falseFacts.filter((f) => f.validationStatus !== ValidationStatus.VERIFIED).map((f) => f.factId) };
    return { status: Tristate.UNKNOWN, supportingFactIds: [], contradictingFactIds: [...falseFacts].map((f) => f.factId), unverifiedFactIds: [...trueFacts, ...falseFacts].filter((f) => f.validationStatus !== ValidationStatus.VERIFIED).map((f) => f.factId) };
  }

  private buildEventTimeline(ctx: ExecutionContext): void {
    ctx.eventTimeline = [];
    for (const fact of ctx.factRegistry.values()) {
      if (fact.eventDate && fact.subject === "Ancestor") ctx.eventTimeline.push({ eventId: `EV-${fact.factId}`, type: "ANCESTOR_DEATH", date: fact.eventDate, datePrecision: "EXACT", sourceFactIds: [fact.factId] });
    }
    ctx.eventTimeline.sort((a, b) => this.strictDateTimestamp(a.date) - this.strictDateTimestamp(b.date));
  }

  private getFacts(ctx: ExecutionContext, subject: string, predicate: string): AtomicFact[] { return Array.from(ctx.factRegistry.values()).filter((f) => f.subject === subject && f.predicate === predicate); }
  private getAllFactIds(ctx: ExecutionContext): string[] { return Array.from(ctx.factRegistry.keys()); }

  // ========================================================================
  // RULE GRAPH / LOGICAL OPERATORS
  // ========================================================================

  private executeElementCompletenessGate(ctx: ExecutionContext, claimType: ClaimType): { status: GateStatus; allSatisfied: boolean; missingElements: string[]; unknownElements: string[]; fatalFailures: string[]; ruleExecutionResults: RuleExecutionResult[] } {
    const rules = this.ruleRegistry.getClaimElements(claimType, "BANGLADESH");
    if (!rules.length) return { status: GateStatus.INDETERMINATE, allSatisfied: false, missingElements: ["Claim-specific rule graph unavailable."], unknownElements: [], fatalFailures: [], ruleExecutionResults: [] };
    const missingElements: string[] = [], unknownElements: string[] = [], fatalFailures: string[] = [], results: RuleExecutionResult[] = [];

    for (const rule of rules) {
      const prs: PredicateExecutionResult[] = [];
      for (const p of rule.predicates) {
        const facts = this.getFacts(ctx, p.subject, p.predicate).filter((f) => p.object === undefined || f.object === p.object);
        if (!facts.length) { prs.push({ predicateSubject: p.subject, predicateId: p.predicateId, status: "UNKNOWN", factIds: [] }); continue; }
        const e = this.evaluateFact(ctx, p.subject, p.predicate, p.object, { requireVerified: p.requireVerified });
        const status = e.status === p.requiredTruth ? "TRUE" : e.status === Tristate.UNKNOWN ? "UNKNOWN" : "FALSE";
        prs.push({ predicateSubject: p.subject, predicateId: p.predicateId, status, factIds: status === "TRUE" ? e.supportingFactIds : status === "FALSE" ? e.contradictingFactIds : e.unverifiedFactIds });
      }

      const trueCount = prs.filter((x) => x.status === "TRUE").length;
      const falseCount = prs.filter((x) => x.status === "FALSE").length;
      const unknownCount = prs.filter((x) => x.status === "UNKNOWN").length;
      let status: RuleExecutionStatus = "UNKNOWN";
      let explanationCode = "RULE_PREDICATES_UNRESOLVED";

      if (rule.logicalOperator === "ALL") {
        if (falseCount > 0) { status = "FAILED"; explanationCode = rule.outcomeIfFailed; }
        else if (unknownCount > 0) { status = "UNKNOWN"; }
        else if (trueCount === prs.length) { status = "SATISFIED"; explanationCode = rule.outcomeIfSatisfied; }
      } else if (rule.logicalOperator === "ANY") {
        if (trueCount > 0) { status = "SATISFIED"; explanationCode = rule.outcomeIfSatisfied; }
        else if (falseCount === prs.length) { status = "FAILED"; explanationCode = rule.outcomeIfFailed; }
      } else {
        const n = rule.atLeastN ?? prs.length;
        if (trueCount >= n) { status = "SATISFIED"; explanationCode = rule.outcomeIfSatisfied; }
        else if (trueCount + unknownCount < n) { status = "FAILED"; explanationCode = rule.outcomeIfFailed; }
      }

      if (status === "FAILED") fatalFailures.push(`${rule.ruleId}: ${rule.outcomeIfFailed}`);
      if (status === "UNKNOWN") unknownElements.push(`${rule.ruleId}: unresolved predicates`);
      if (status === "NOT_EXECUTED") missingElements.push(`${rule.ruleId}: not executed`);
      results.push({ ruleId: rule.ruleId, status, predicateResults: prs, authorityIds: [rule.authority.authorityId ?? rule.authority.citation ?? `${rule.authority.act} ${rule.authority.section}`], burden: rule.burden, legalEffect: rule.legalEffect, explanationCode });
      recordTrace(ctx, { layer: "P1_RULE", description: `Rule ${rule.ruleId} evaluated.`, dependsOnFacts: prs.flatMap((p) => p.factIds), dependsOnRules: [rule.ruleId], result: status });
    }

    if (fatalFailures.length) return { status: GateStatus.FAIL, allSatisfied: false, missingElements, unknownElements, fatalFailures, ruleExecutionResults: results };
    if (missingElements.length || unknownElements.length || results.some((r) => r.status === "BLOCKED" || r.status === "NOT_EXECUTED" || r.status === "UNKNOWN")) return { status: GateStatus.INDETERMINATE, allSatisfied: false, missingElements, unknownElements, fatalFailures, ruleExecutionResults: results };
    return { status: GateStatus.PASS, allSatisfied: true, missingElements: [], unknownElements: [], fatalFailures: [], ruleExecutionResults: results };
  }

  // ========================================================================
  // AUTHORITY / CITATION
  // ========================================================================

  private mapLegislation(claimType: ClaimType) {
    const mapping = this.ruleRegistry.getLegislationMapping(claimType);
    let precedents: unknown[] = [];
    try { precedents = CitationValidator.getVerifiedPrecedentsForContext(claimType, {}); } catch { precedents = []; }
    const citationValidationAudit: CitationValidationAudit = {
      totalCitations: precedents.length, verifiedCount: 0, rejectedCount: 0,
      validationStandard: "BCCAA AUTHORITY REGISTRY STATE MACHINE",
      auditStatus: precedents.length ? "RESOLVED" : "NOT_EXECUTED",
      registrySignature: this.ruleRegistry.identity.authorityRegistryDigest,
      note: "Resolved metadata is not represented as text-verified unless the authority registry explicitly proves it.",
      citationStates: precedents.map((p) => ({ citation: canonicalStringify(p), state: "RESOLVED" })),
    };
    return { primaryAct: mapping.primaryAct, relevantSections: mapping.relevantSections, precedents, citationValidationAudit, equityPrinciples: [] };
  }

  // ========================================================================
  // LIMITATION / JURISDICTION / PARTY / STAGES
  // ========================================================================

  private executeLimitationEngine(ctx: ExecutionContext): CaseAnalysisResponse["stage3"] {
    const death = Array.from(ctx.factRegistry.values()).find((f) => f.subject === "Ancestor" && f.predicate === "Vital Status" && f.object === "DECEASED" && f.eventDate);
    if (!death || !this.isStrictDate(death.eventDate ?? "")) return { accrualDate: "NOT_EXECUTED: missingDependencies=[VALID_ACCRUAL_DATE]", prescribedPeriod: "NOT_EXECUTED", limitationArticle: "NOT_EXECUTED", isTimeBarred: false, exceptionsOrExtensions: "NOT_EXECUTED", preliminaryAnalysis: "Limitation requires an authorized cause-of-action rule and a valid calendar date.", timelineValidation: { agreementDate: null, refusalDate: null, isAgreementDateExtracted: false, isRefusalDateExtracted: false, calculationType: "missing_dates", validationStatus: "invalid_gaps", explanation: "No authorized limitation calculation executed." } };
    return { accrualDate: death.eventDate!, prescribedPeriod: "NOT_EXECUTED: missingDependencies=[CAUSE_OF_ACTION_LIMITATION_RULE]", limitationArticle: "NOT_EXECUTED", isTimeBarred: false, exceptionsOrExtensions: "NOT_EXECUTED", preliminaryAnalysis: "Accrual candidate identified; no limitation conclusion is authorized without the versioned limitation rule.", timelineValidation: { agreementDate: null, refusalDate: null, isAgreementDateExtracted: false, isRefusalDateExtracted: false, calculationType: "rule_registry_required", validationStatus: "invalid_gaps", explanation: "Date does not itself authorize limitation." } };
  }

  private extractValuation(ctx: ExecutionContext) {
    const facts = Array.from(ctx.factRegistry.values()).filter((f) => f.predicate === "Monetary Amount" && typeof f.normalizedValue === "number" && f.validationStatus === ValidationStatus.VERIFIED);
    if (facts.length !== 1) return { amount: null as number | null, sourceFactIds: facts.map((f) => f.factId) };
    return { amount: Number(facts[0].normalizedValue), sourceFactIds: [facts[0].factId] };
  }

  private executeJurisdictionEngine(ctx: ExecutionContext): CaseAnalysisResponse["stage5"] {
    const valuation = this.extractValuation(ctx);
    if (valuation.amount === null) return { territorial: { rule: "Territorial jurisdiction requires validated location facts.", governingSection: "CPC / applicable law", jurisdictionalFacts: this.getLocationDescription(ctx) }, pecuniary: { valuation: "INDETERMINATE", courtLevel: "NOT_EXECUTED: missingDependencies=[VERIFIED_VALUATION,CURRENT_PECUNIARY_THRESHOLD]", pecuniaryLimits: "NOT_EXECUTED", suitsValuationActNotes: "VALUATION GATE BLOCKED" }, subjectMatter: { isExcluded: false, forum: "NOT_EXECUTED", governingStatute: "Applicable jurisdiction law" }, objectionStrategy: "Verify valuation, territorial connection and current jurisdiction registry." };
    return { territorial: { rule: "Territorial jurisdiction requires validated location facts.", governingSection: "CPC / applicable law", jurisdictionalFacts: this.getLocationDescription(ctx) }, pecuniary: { valuation: `BDT ${valuation.amount.toLocaleString()}`, courtLevel: "NOT_EXECUTED: missingDependencies=[CURRENT_PECUNIARY_THRESHOLD]", pecuniaryLimits: "NOT_EXECUTED", suitsValuationActNotes: "Verified valuation; current threshold registry required." }, subjectMatter: { isExcluded: false, forum: "NOT_EXECUTED", governingStatute: "Applicable jurisdiction law" }, objectionStrategy: "Verify current jurisdiction rules." };
  }

  private executePartyStandiRules(ctx: ExecutionContext, claimType: ClaimType): CaseAnalysisResponse["stage4"] {
    const plaintiffs: Array<{ side: "plaintiff"; name: string; identity: string; capacity: string }> = [];
    const defendants: Array<{ side: "defendant"; name: string; identity: string; capacity: string }> = [];
    for (const fact of ctx.factRegistry.values()) {
      if (fact.subject !== "Plaintiff" && fact.subject !== "Defendant") continue;
      const p = { side: fact.subject === "Plaintiff" ? "plaintiff" as const : "defendant" as const, name: fact.assertedBy ?? "UNIDENTIFIED_PARTY", identity: fact.object ?? "UNKNOWN", capacity: "REQUIRES_VALIDATION" };
      (p.side === "plaintiff" ? plaintiffs : defendants).push(p as never);
    }
    let locus = "INDETERMINATE pending validated party capacity and cause-of-action facts.";
    if (claimType === "INHERITANCE_CONSULTATION") {
      const d = this.evaluateFact(ctx, "Ancestor", "Vital Status", "DECEASED", { requireVerified: false }).status;
      if (d === Tristate.TRUE) locus = "Succession-death candidate identified; heirship and entitlement require validation.";
    }
    return { plaintiffs, defendants, joinderIssues: "Joinder requires validated parties, interests and procedural rules.", locusStandiSummary: locus };
  }

  private executePleadingRules(gate: { status: GateStatus; missingElements: string[]; unknownElements: string[]; fatalFailures: string[] }): CaseAnalysisResponse["stage6"] {
    const checklist = ["Plead complete cause of action.", "Identify material facts.", "Identify parties and capacities.", "Identify source documents."];
    const grounds = gate.status === GateStatus.FAIL ? gate.fatalFailures.map((x) => `LEGAL ELEMENT FAILURE: ${x}`) : [];
    if (gate.status === GateStatus.INDETERMINATE) checklist.push(...gate.unknownElements.map((x) => `VERIFY BEFORE RELIEF: ${x}`));
    return { plaintChecklist: checklist, groundsForRejection: grounds, writtenStatementDeemedAdmissions: "Apply only after procedural facts are established.", counterclaimsOrSetOff: "Requires validated party-specific inputs." };
  }

  private executeIssueFramingRules(ctx: ExecutionContext, gate: { missingElements: string[]; unknownElements: string[] }): CaseAnalysisResponse["stage7"] {
    const issues: Array<{ issueNo: number; title: string; type: string; burden: string; evidenceRequired: string }> = [{ issueNo: 1, title: "Whether the material legal elements are established.", type: "Mixed Fact and Law", burden: "Claim-specific burden", evidenceRequired: "Validated facts and source material" }];
    let n = 2;
    for (const x of [...gate.missingElements, ...gate.unknownElements]) issues.push({ issueNo: n++, title: `Whether ${x} is established.`, type: "Fact / Law", burden: "Applicable burden", evidenceRequired: "Primary evidence" });
    for (const f of ctx.factRegistry.values()) if (f.disputedProposition) issues.push({ issueNo: n++, title: `Whether disputed proposition is established: ${f.disputedProposition}`, type: "Fact", burden: "Applicable burden", evidenceRequired: "Evidence resolving contradiction or denial" });
    return { issues };
  }

  private executeEvidenceRules(ctx: ExecutionContext): CaseAnalysisResponse["stage8"] {
    const evidenceList = Array.from(ctx.factRegistry.values()).map((f) => ({ item: f.proposition, source: f.source.documentId, type: "Fact Source", governingSection: "Applicable evidence law", admissibilityChallenge: f.validationStatus === ValidationStatus.VERIFIED ? "VALIDATED" : "ASSERTED_ONLY: verification required before reliance." }));
    return { evidenceList, burdenAssignments: ["Assign burden element-by-element under authorized evidence rules."], statutoryPresumptions: [] };
  }

  private executeMeritRules(gate: { status: GateStatus }): CaseAnalysisResponse["stage9"] {
    const finding = gate.status === GateStatus.FAIL ? "ELEMENT FAILURE" : gate.status === GateStatus.INDETERMINATE ? "INDETERMINATE" : "ELEMENTS SATISFIED; remaining rules required";
    return { issueDetails: [{ issueNo: 1, issueTitle: "Claim elements and merits", plaintiffPosition: "Derived only from recorded propositions/assertions.", defendantPosition: "Requires independent defence assertions.", courtAnalysis: "Deterministic rule evaluation; UNKNOWN is not FALSE.", projectedFinding: finding }] };
  }

  private executeEquityRules(gate: { status: GateStatus }): CaseAnalysisResponse["stage10"] { return { applicablePrinciples: [], discretionaryReliefCheck: gate.status === GateStatus.PASS ? "Mandatory gate passed; discretionary authority still requires rule evaluation." : "BLOCKED until mandatory predicates resolve." }; }
  private executeProcedureRules(): CaseAnalysisResponse["stage11"] { return { timelineProgress: [{ stageName: "Institution", cpcReference: "Applicable CPC provision", subActions: "Validate material facts, jurisdiction, limitation and pleading prerequisites.", strategicPlay: "Do not cure UNKNOWN by assumption." }] }; }
  private executeAppealRules(): CaseAnalysisResponse["stage12"] { return { appealNodes: [{ level: "First Appeal", authority: "Requires validated judgment and appellate-jurisdiction inputs.", scope: "Fact and law according to applicable appellate rules.", governingSection: "Applicable CPC appellate provision" }] }; }

  // ========================================================================
  // P2 SYNTHESIS
  // ========================================================================

  private executeFailClosedSynthesis(ctx: ExecutionContext, f0Gate: FactConsistencyGateOutput, _claimType: ClaimType, gate: { status: GateStatus; missingElements: string[]; unknownElements: string[]; fatalFailures: string[]; ruleExecutionResults?: RuleExecutionResult[] }): CaseAnalysisResponse["stage13"] {
    if (f0Gate.gateStatus === "HALT_CRITICAL_CONFLICT" || gate.status === GateStatus.HALT) return { overview: "HALTED: critical factual conflict.", reliefDecree: "HALTED", costsApportionment: "N/A", equitableBars: "N/A", executionPathway: "None until conflict resolution." };
    if (gate.status === GateStatus.FAIL) return { overview: `FAIL-CLOSED: ${gate.fatalFailures.join("; ")}`, reliefDecree: "NO RELIEF AUTHORIZATION.", costsApportionment: "Pending", equitableBars: "Discretion cannot override failed mandatory elements.", executionPathway: "None." };
    if (gate.status === GateStatus.INDETERMINATE) return { overview: `INDETERMINATE: ${[...gate.missingElements, ...gate.unknownElements].join("; ")}`, reliefDecree: "NO AUTOMATIC DECREE. HUMAN / AUTHORITY VERIFICATION REQUIRED.", costsApportionment: "Pending", equitableBars: "Blocked", executionPathway: "None until predicates resolve." };
    recordTrace(ctx, { layer: "P2_SYNTHESIS", description: "Mandatory rule graph satisfied.", dependsOnFacts: this.getAllFactIds(ctx), dependsOnRules: (gate.ruleExecutionResults ?? []).map((r) => r.ruleId), result: "ELEMENTS_SATISFIED" });
    return { overview: "MANDATORY ELEMENT GATE PASSED. Final judicial disposition remains outside autonomous authorization.", reliefDecree: "RELIEF ELIGIBILITY ONLY — NO AUTONOMOUS JUDICIAL DECREE.", costsApportionment: "Pending", equitableBars: "Requires authorized discretionary rules.", executionPathway: "Requires authorized procedural execution rule after judgment." };
  }

  // ========================================================================
  // RESPONSE / FORENSIC HASHING
  // ========================================================================

  private buildResponse(ctx: ExecutionContext, request: AnalyzeRequest, claimType: ClaimType, f0Gate: FactConsistencyGateOutput, synthesis: CaseAnalysisResponse["stage13"], data: any): CaseAnalysisResponse {
    const stage0 = this.buildStage0(ctx, claimType);
    const halted = data.halted === true;
    const response: any = {
      gateF0: f0Gate,
      stage0,
      stage1: halted ? { primaryDomain: "N/A — F0 HALT", subsidiaryDomains: [], triggerFacts: [] } : data.domain,
      stage2: halted ? { primaryAct: "N/A", relevantSections: [], precedents: [], citationValidationAudit: null, equityPrinciples: [] } : data.legislation,
      stage3: halted ? { accrualDate: "Not determinable", prescribedPeriod: "Not determinable", limitationArticle: "Not determinable", isTimeBarred: false, exceptionsOrExtensions: "Not evaluated", preliminaryAnalysis: "F0 HALT", timelineValidation: { agreementDate: null, refusalDate: null, isAgreementDateExtracted: false, isRefusalDateExtracted: false, calculationType: "halt", validationStatus: "invalid_gaps", explanation: "F0 HALT" } } : data.limitation,
      stage4: halted ? { plaintiffs: [], defendants: [], joinderIssues: "N/A — F0 HALT", locusStandiSummary: "Blocked" } : data.standi,
      stage5: halted ? { territorial: { rule: "N/A", governingSection: "N/A", jurisdictionalFacts: "N/A" }, pecuniary: { valuation: "N/A", courtLevel: "N/A", pecuniaryLimits: "N/A", suitsValuationActNotes: "N/A" }, subjectMatter: { isExcluded: false, forum: "N/A", governingStatute: "N/A" }, objectionStrategy: "N/A" } : data.jurisdiction,
      stage6: halted ? { plaintChecklist: [], groundsForRejection: ["F0 HALT"], writtenStatementDeemedAdmissions: "N/A", counterclaimsOrSetOff: "N/A" } : data.pleading,
      stage7: halted ? { issues: [] } : data.issues,
      stage8: halted ? { evidenceList: [], burdenAssignments: [], statutoryPresumptions: [] } : data.evidence,
      stage9: halted ? { issueDetails: [] } : data.merits,
      stage10: halted ? { applicablePrinciples: [], discretionaryReliefCheck: "N/A — F0 HALT" } : data.equity,
      stage11: halted ? { timelineProgress: [] } : data.procedure,
      stage12: halted ? { appealNodes: [] } : data.appeal,
      stage13: synthesis,
      _security: { analyzedBy: request.user.email, analyzedAt: Date.now(), licenseId: request.license.licenseId, forensicHash: "PENDING_OUTPUT_HASH", engineVersion: ENGINE_MANIFEST.engineVersion },
    };
    response._security.forensicHash = this.computeOutputHash(response);
    return response as CaseAnalysisResponse;
  }

  private computeOutputHash(response: CaseAnalysisResponse): string {
    const clone: any = JSON.parse(JSON.stringify(response));
    if (clone?._security) delete clone._security.forensicHash;
    return canonicalHash(clone);
  }

  private async persistAudit(ctx: ExecutionContext, request: AnalyzeRequest, caseId: string, startTime: number, outcome: AuditRecordPayload["outcome"], outputHash: string): Promise<void> {
    const rawInputHash = canonicalHash(request.input?.factPattern ?? "");
    const extractionHash = canonicalHash({ propositions: Array.from(ctx.propositionRegistry.values()), assertions: Array.from(ctx.assertionRegistry.values()) });
    const factRegistryHash = canonicalHash(Array.from(ctx.factRegistry.values()));
    const timelineHash = canonicalHash(ctx.eventTimeline);
    const executionTraceHash = canonicalHash(ctx.executionTrace);
    const ruleRegistryHash = canonicalHash({ identity: this.ruleRegistry.identity, version: this.ruleRegistry.version, rules: (["SPECIFIC_PERFORMANCE", "DECLARATION_AND_POSSESSION", "INHERITANCE_CONSULTATION", "GENERAL_CIVIL"] as ClaimType[]).map((c) => ({ claimType: c, rules: this.ruleRegistry.getClaimElements(c, "BANGLADESH") })) });
    const payload: AuditRecordPayload = {
      caseId, rawInputHash, extractionHash, inputHash: extractionHash, factRegistryHash, timelineHash, eventTimelineHash: timelineHash,
      corpusIdentity: this.ruleRegistry.identity, corpusDigest: this.ruleRegistry.identity.corpusDigest,
      ruleRegistryVersion: this.ruleRegistry.version, ruleRegistryHash, executionTraceHash, outputHash,
      manifest: ENGINE_MANIFEST, executionMilliseconds: Date.now() - startTime, analyzedByUserId: request.user.id, outcome,
    };
    await this.auditSink.append(payload);
  }

  private buildStage0(ctx: ExecutionContext, claimType: ClaimType): any {
    const facts = Array.from(ctx.factRegistry.values());
    return {
      factualSummary: `P0 contains ${facts.length} candidate atomic facts, ${ctx.propositionRegistry.size} propositions and ${ctx.assertionRegistry.size} assertions.`,
      chronology: ctx.eventTimeline,
      admittedFacts: facts.filter((f) => f.assertionType === AssertionType.ADMITTED).map((f) => f.proposition),
      disputedFacts: facts.filter((f) => !!f.disputedProposition).map((f) => f.disputedProposition),
      unknownFacts: facts.filter((f) => f.truth === Tristate.UNKNOWN).map((f) => f.proposition),
      quantumFacts: facts.filter((f) => f.predicate === "Monetary Amount").map((f) => `BDT ${Number(f.normalizedValue).toLocaleString()}`),
      factsMeta: { category: claimType, isRegisteredBainapatra: this.safeTruth(ctx, "Bainapatra", "Registration Status", "REGISTERED"), isBalanceDeposited: this.safeTruth(ctx, "Treasury Deposit", "Payment Status", "DEPOSITED"), plaintiffHasRegisteredTitle: this.safeTruth(ctx, "Plaintiff", "Registered Title", "REGISTERED"), dispossessionProven: this.safeTruth(ctx, "Plaintiff", "Dispossession", "PROVEN_ALLEGED"), isUsingDefaultAmounts: false },
      atomicFacts: facts, propositions: Array.from(ctx.propositionRegistry.values()), assertions: Array.from(ctx.assertionRegistry.values()), contradictionGraph: ctx.contradictionGraph,
      eventTimeline: ctx.eventTimeline, provenance: facts.map((f) => ({ factId: f.factId, assertionId: f.assertionId, propositionId: f.propositionId, source: f.source, validation: f.validation, validationStatus: f.validationStatus })),
    };
  }

  private safeTruth(ctx: ExecutionContext, subject: string, predicate: string, object: string): boolean { try { return this.evaluateFact(ctx, subject, predicate, object, { requireVerified: false }).status === Tristate.TRUE; } catch { return false; } }

  private buildHaltResponse(ctx: ExecutionContext, caseId: string, reason: string): CaseAnalysisResponse {
    recordTrace(ctx, { layer: "SYSTEM_ERROR", description: reason, dependsOnFacts: [], dependsOnRules: [], result: "HALTED" });
    const response: any = {
      gateF0: { gateStatus: "HALT_CRITICAL_CONFLICT", details: reason },
      stage0: this.buildStage0(ctx, "GENERAL_CIVIL"), stage1: { primaryDomain: "N/A", subsidiaryDomains: [], triggerFacts: [] },
      stage2: { primaryAct: "N/A", relevantSections: [], precedents: [], citationValidationAudit: null, equityPrinciples: [] },
      stage3: { accrualDate: "Not determinable", prescribedPeriod: "Not determinable", limitationArticle: "Not determinable", isTimeBarred: false, exceptionsOrExtensions: "Not evaluated", preliminaryAnalysis: reason, timelineValidation: { agreementDate: null, refusalDate: null, isAgreementDateExtracted: false, isRefusalDateExtracted: false, calculationType: "halt", validationStatus: "invalid_gaps", explanation: reason } },
      stage4: { plaintiffs: [], defendants: [], joinderIssues: "N/A", locusStandiSummary: reason }, stage5: { territorial: { rule: "N/A", governingSection: "N/A", jurisdictionalFacts: "N/A" }, pecuniary: { valuation: "N/A", courtLevel: "N/A", pecuniaryLimits: "N/A", suitsValuationActNotes: "N/A" }, subjectMatter: { isExcluded: false, forum: "N/A", governingStatute: "N/A" }, objectionStrategy: "N/A" },
      stage6: { plaintChecklist: [], groundsForRejection: [reason], writtenStatementDeemedAdmissions: "N/A", counterclaimsOrSetOff: "N/A" }, stage7: { issues: [] }, stage8: { evidenceList: [], burdenAssignments: [], statutoryPresumptions: [] }, stage9: { issueDetails: [] }, stage10: { applicablePrinciples: [], discretionaryReliefCheck: "N/A" }, stage11: { timelineProgress: [] }, stage12: { appealNodes: [] },
      stage13: { overview: reason, reliefDecree: "HALTED", costsApportionment: "N/A", equitableBars: "N/A", executionPathway: "None until blocking condition is resolved." },
      _security: { analyzedBy: "SYSTEM", analyzedAt: Date.now(), licenseId: "N/A", forensicHash: "PENDING_OUTPUT_HASH", engineVersion: ENGINE_MANIFEST.engineVersion, caseId },
    };
    response._security.forensicHash = this.computeOutputHash(response);
    return response as CaseAnalysisResponse;
  }

  // ========================================================================
  // SMALL UTILITIES / STRICT CALENDAR
  // ========================================================================

  private resolveClaimType(rawText: string, focusDomain: string): ClaimType {
    if (["SPECIFIC_PERFORMANCE", "DECLARATION_AND_POSSESSION", "INHERITANCE_CONSULTATION", "GENERAL_CIVIL"].includes(focusDomain)) return focusDomain as ClaimType;
    const text = this.normalizeText(rawText);
    const scores: Array<[ClaimType, number]> = [
      ["SPECIFIC_PERFORMANCE", this.keywordScore(text, ["specific performance", "bainapatra", "agreement to sell", "sale agreement"])],
      ["DECLARATION_AND_POSSESSION", this.keywordScore(text, ["declaration", "possession", "dispossession", "encroachment"])],
      ["INHERITANCE_CONSULTATION", this.keywordScore(text, ["inheritance", "heir", "succession", "ancestor", "partition", "deceased"])],
    ];
    scores.sort((a, b) => b[1] - a[1]);
    return scores[0][1] > 0 ? scores[0][0] : "GENERAL_CIVIL";
  }

  private keywordScore(text: string, keywords: string[]): number { return keywords.reduce((n, k) => n + (text.includes(k) ? 1 : 0), 0); }
  private normalizeText(text: string): string { return text.toLowerCase().replace(/\s+/g, " ").trim(); }

  private parseMoney(value: string): number | null {
    const n = Number(value.replace(/(?:BDT|Tk\.?|Taka)/gi, "").replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  private isStrictDate(value: string): boolean { return this.parseStrictDate(value) !== null; }
  private parseStrictDate(value: string): Date | null {
    const m = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/.exec(value.trim());
    if (!m) return null;
    let year = Number(m[3]); if (year < 100) year += year >= 50 ? 1900 : 2000;
    const month = Number(m[2]), day = Number(m[1]);
    if (month < 1 || month > 12 || day < 1) return null;
    const days = [31, this.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > days[month - 1]) return null;
    return new Date(Date.UTC(year, month - 1, day));
  }
  private isLeapYear(year: number): boolean { return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0); }
  private strictDateTimestamp(value: string | null): number { const d = value ? this.parseStrictDate(value) : null; return d ? d.getTime() : Number.MAX_SAFE_INTEGER; }
  private getLocationDescription(ctx: ExecutionContext): string { const l = this.getFacts(ctx, "Property", "Location"); return l.length ? l.map((x) => String(x.normalizedValue ?? x.object ?? "UNKNOWN")).join("; ") : "Location UNKNOWN"; }
  private classifyDomain(ctx: ExecutionContext, claimType: ClaimType): any { return { primaryDomain: claimType === "SPECIFIC_PERFORMANCE" ? "Specific Performance" : claimType === "DECLARATION_AND_POSSESSION" ? "Declaration & Possession" : claimType === "INHERITANCE_CONSULTATION" ? "Partition & Succession" : "General Civil", subsidiaryDomains: [], triggerFacts: Array.from(ctx.factRegistry.values()).map((f) => ({ domain: f.subject, fact: f.proposition, trigger: f.predicate })) }; }
}
