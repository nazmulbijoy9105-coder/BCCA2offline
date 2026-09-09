import { describe, expect, it } from "vitest";
import { finalizeOutputResponse } from "./OutputResponseFinalizer";
import { getOutputCorpusHash } from "./OutputCorpusHasher";
import { generateOutputAuditTrail } from "./OutputAuditTrail";
import type { CaseAnalysisResponse } from "../../types/types";

function makeResponse(
  overrides: Partial<CaseAnalysisResponse> = {},
): CaseAnalysisResponse {
  return {
    caseId: "P10-TEST",
    executionTimestamp: "1970-01-01T00:00:00.000Z",
    stage0: {
      atomicFacts: [],
      contradictionGraph: [],
      eventTimeline: [],
      executionTrace: [],
      warnings: [],
      quantumFacts: [],
    },
    stage1: {
      primaryDomain: "TEST",
      subsidiaryDomains: [],
      domainConfidence: "NONE",
    },
    stage2: {
      relevantSections: [],
      primaryAct: null,
      precedents: [],
      citationValidationAudit: {
        totalCitations: 0,
        validatedCitations: 0,
        unverifiedCitations: 0,
        auditStatus: "NOT_EXECUTED",
        validationStandard: "test",
      },
      equityPrinciples: [],
    },
    stage3: {
      isTimeBarred: null,
      accrualDate: null,
      limitationPeriodYears: null,
      calculationType: "missing_dates",
      preliminaryAnalysis: "indeterminate",
    },
    stage4: {
      plaintiffs: [],
      defendants: [],
      joinderIssues: "",
      locusStandiSummary: "",
    },
    stage5: {
      territorial: {
        rule: null,
        governingSection: null,
        jurisdictionalFacts: null,
      },
      pecuniary: {
        valuation: null,
        courtLevel: null,
        pecuniaryLimits: null,
        suitsValuationActNotes: null,
      },
      subjectMatter: {
        isExcluded: false,
        forum: null,
        governingStatute: null,
      },
      objectionStrategy: null,
      plaintChecklist: [],
      groundsForRejection: [],
    },
    stage6: {
      framedIssues: [],
      issueCount: 0,
    },
    stage7: {
      oralAssertions: 0,
      documentaryEvidence: 0,
      missingEvidence: [],
    },
    stage8: {
      evidenceList: [],
      burdenAssignments: [],
      statutoryPresumptions: [],
      elementGateStatus: "HALT",
      allSatisfied: false,
      missingElements: [],
      unknownElements: [],
      fatalFailures: [],
      ruleExecutionResults: [],
    },
    stage9: {},
    stage10: {},
    stage11: {},
    stage12: {
      appealStatus: "NOT_DETERMINED",
      appealGrounds: [],
      appealNodes: [],
      appealDeterminationReason: "test",
    },
    stage13: {
      conclusion: "Structural test conclusion.",
      confidence: "NONE",
      requiresHumanReview: true,
      humanReviewReason: "test",
      elementSummary: [],
      legalConclusions: [],
      recommendations: [],
    },
    ...overrides,
  } as CaseAnalysisResponse;
}

describe("P10 output integrity", () => {
  it("finalizes a deterministic engine response with valid integrity metadata", () => {
    const response = finalizeOutputResponse(makeResponse());

    expect(response.outputIntegrity).toBeDefined();
    expect(response.outputIntegrity?.isValid).toBe(true);
    expect(response.outputIntegrity?.schemaId).toBe("BD-MEMO-SCHEMA-V1");
    expect(response.outputIntegrity?.schemaVersion).toBe("1.0");
    expect(response.outputIntegrity?.corpusHash).toMatch(/^[0-9A-F]{64}$/);
    expect(response.outputIntegrity?.auditTrail.timestamp).toBe(
      "1970-01-01T00:00:00.000Z",
    );
  });

  it("produces the same corpus hash across repeated calls", () => {
    expect(getOutputCorpusHash()).toBe(getOutputCorpusHash());
  });

  it("produces a deterministic audit trail without reading wall-clock time", () => {
    const first = generateOutputAuditTrail(
      "1970-01-01T00:00:00.000Z",
      true,
      [],
    );
    const second = generateOutputAuditTrail(
      "1970-01-01T00:00:00.000Z",
      true,
      [],
    );

    expect(first).toEqual(second);
  });

  it("fails closed when a legal conclusion is not explicitly structured", () => {
    expect(() =>
      finalizeOutputResponse(
        makeResponse({
          stage13: {
            conclusion: "Structural test conclusion.",
            confidence: "LOW",
            requiresHumanReview: true,
            humanReviewReason: "test",
            elementSummary: [],
            legalConclusions: ["unsupported conclusion"] as any[],
            recommendations: [],
          },
        }),
      ),
    ).toThrow(/Unsupported Conclusion Format/);
  });

  it("fails provenance validation for an explicitly structured but unbound conclusion", () => {
    expect(() =>
      finalizeOutputResponse(
        makeResponse({
          stage13: {
            conclusion: "Structural test conclusion.",
            confidence: "LOW",
            requiresHumanReview: true,
            humanReviewReason: "test",
            elementSummary: [],
            legalConclusions: [
              {
                conclusionId: "CONCLUSION-1",
                text: "A structured conclusion without source provenance.",
              },
            ],
            recommendations: [],
          },
        }),
      ),
    ).toThrow(/P10 Output Enforcement Failure: PROVENANCE/);
  });
});
