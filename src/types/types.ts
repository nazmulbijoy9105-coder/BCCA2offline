import { AuthUser, LicenseData } from "./auth.types";

export interface EngineInput {
  factPattern: string;
  focusDomain: string;
  user: AuthUser;
  license: LicenseData;
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
  stage0: {
    chronology: Array<{
      date: string;
      event: string;
      partiesInvolved: string;
      statutorySignificance: string;
    }>;
    admittedFacts: string[];
    disputedFacts: string[];
    inferredFacts: string[];
    liabilityFacts: string[];
    quantumFacts: string[];
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
      court: string;
      holding: string;
      relevance: string;
    }>;
    equityPrinciples: string[];
  };
  stage3: {
    accrualDate: string;
    prescribedPeriod: string;
    limitationArticle: string;
    isTimeBarred: boolean;
    exceptionsOrExtensions: string;
    preliminaryAnalysis: string;
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
