import { AuthUser, LicenseData } from "./auth.types";

export interface EngineInput {
  factPattern: string;
  focusDomain: string;
  user: AuthUser;
  license: LicenseData;
}

export interface AtomicFact {
  factId: string;
  proposition: string;
  value: unknown;
  sourceDocumentId?: string;
  sourcePage?: number;
  sourceParagraph?: string;
  assertedBy?: string;
  factStatus: "ADMITTED" | "DISPUTED" | "ALLEGED" | "PROVED" | "UNKNOWN" | "CONTRADICTED";
  temporalStatus: "PAST" | "CURRENT" | "FUTURE" | "UNKNOWN";
  confidence: number;
  materiality: "CRITICAL" | "MATERIAL" | "SECONDARY";
  supersedes?: string;
}

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
  courtLevel: string;
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
    primaryAct: string;
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
      auditStatus: "PASS_100_PERCENT_DETERMINISTIC" | "FAIL_UNVERIFIED_DETECTED";
      registrySignature: string;
    };
    equityPrinciples: string[];
  };
  stage3: {
    accrualDate: string;
    prescribedPeriod: string;
    limitationArticle: string;
    isTimeBarred: boolean;
    exceptionsOrExtensions: string;
    preliminaryAnalysis: string;
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
    locusStandiSummary: string;
  };
  stage5: {
    territorial: {
      rule: string;
      governingSection: string;
      jurisdictionalFacts: string;
    };
    pecuniary: {
      valuation: string;
      courtLevel: string;
      pecuniaryLimits: string;
      suitsValuationActNotes: string;
    };
    subjectMatter: {
      isExcluded: boolean;
      forum: string;
      governingStatute: string;
    };
    objectionStrategy: string;
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
      governingSection: string;
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
    discretionaryReliefCheck: string;
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
      governingSection: string;
    }>;
  };
  stage13: {
    overview: string;
    reliefDecree: string;
    costsApportionment: string;
    equitableBars: string;
    executionPathway: string;
  };
  _security?: {
    analyzedBy: string;
    analyzedAt: number;
    licenseId: string;
    forensicHash: string;
    engineVersion: string;
  };
}
