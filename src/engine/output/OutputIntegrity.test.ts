import { describe, expect, it } from "vitest";
import { finalizeOutputResponse } from "./OutputResponseFinalizer";
import { getOutputCorpusHash } from "./OutputCorpusHasher";
import { generateOutputAuditTrail } from "./OutputAuditTrail";
import { verifyOutputIntegrity } from "./OutputIntegrityVerifier";
import type { CaseAnalysisResponse } from "../../types/types";
import type { RuleGraphIdentity } from "../rules/RuleContracts";

const TEST_RULE_GRAPH_IDENTITY: RuleGraphIdentity = {
  corpusId: "BD-DEVELOPMENT-FIXTURE",
  corpusVersion: "DEVELOPMENT-2026.08",
  corpusDigest: "DEVELOPMENT-NOT-A-LEGAL-CORPUS",
  authorityRegistryVersion: "DEVELOPMENT-AUTHORITY-1.0.0",
  authorityRegistryDigest: "DEVELOPMENT-NOT-VERIFIED",
  ruleGraphVersion: "3.0.0",
  ruleGraphDigest: "DEVELOPMENT-RULE-GRAPH",
};

function makeResponse(
  overrides: Partial<CaseAnalysisResponse> = {},
): CaseAnalysisResponse {
  return {
    caseId: "P10-TEST",
    ruleGraphIdentity: TEST_RULE_GRAPH_IDENTITY,
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
    expect(response.outputIntegrity?.authorityRegistryIdentity).toEqual({
      authorityRegistryVersion: "DEVELOPMENT-AUTHORITY-1.0.0",
      authorityRegistryDigest: "DEVELOPMENT-NOT-VERIFIED",
    });
    expect(response.outputIntegrity?.auditTrail.timestamp).toBe(
      "1970-01-01T00:00:00.000Z",
    );
  });

  it("propagates authority registry identity from RuleGraphIdentity", () => {
    const response = finalizeOutputResponse(
      makeResponse({
        ruleGraphIdentity: {
          ...TEST_RULE_GRAPH_IDENTITY,
          authorityRegistryVersion: "TEST-AUTHORITY-2.0.0",
          authorityRegistryDigest: "TEST-AUTHORITY-DIGEST",
        },
      }),
    );

    expect(response.outputIntegrity?.authorityRegistryIdentity).toEqual({
      authorityRegistryVersion: "TEST-AUTHORITY-2.0.0",
      authorityRegistryDigest: "TEST-AUTHORITY-DIGEST",
    });
  });

  it("preserves authority identity independently of execution timestamp", () => {
    const first = finalizeOutputResponse(
      makeResponse({
        executionTimestamp: "1970-01-01T00:00:00.000Z",
      }),
    );
    const second = finalizeOutputResponse(
      makeResponse({
        executionTimestamp: "2024-01-01T00:00:00.000Z",
      }),
    );

    expect(first.outputIntegrity?.authorityRegistryIdentity).toEqual(
      second.outputIntegrity?.authorityRegistryIdentity,
    );
  });

  it("fails closed when RuleGraphIdentity is missing", () => {
    expect(() =>
      finalizeOutputResponse(
        makeResponse({
          ruleGraphIdentity: undefined,
        }),
      ),
    ).toThrow(
      /missing deterministic RuleGraphIdentity authority registry identity/,
    );
  });

  it("does not silently invent authority identity when the digest is missing", () => {
    expect(() =>
      finalizeOutputResponse(
        makeResponse({
          ruleGraphIdentity: {
            ...TEST_RULE_GRAPH_IDENTITY,
            authorityRegistryDigest: "",
          },
        }),
      ),
    ).toThrow(
      /missing deterministic RuleGraphIdentity authority registry identity/,
    );
  });

  it("verifies matching authority identity across RuleGraphIdentity and outputIntegrity", () => {
    const response = finalizeOutputResponse(makeResponse());

    const result = verifyOutputIntegrity(response);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails when output authority registry version does not match RuleGraphIdentity", () => {
    const response = finalizeOutputResponse(makeResponse());

    const tamperedResponse: CaseAnalysisResponse = {
      ...response,
      outputIntegrity: {
        ...response.outputIntegrity!,
        authorityRegistryIdentity: {
          ...response.outputIntegrity!.authorityRegistryIdentity,
          authorityRegistryVersion: "TAMPERED-AUTHORITY-VERSION",
        },
      },
    };

    const result = verifyOutputIntegrity(tamperedResponse);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Output authorityRegistryVersion does not match RuleGraphIdentity.",
    );
  });

  it("fails when output authority registry digest does not match RuleGraphIdentity", () => {
    const response = finalizeOutputResponse(makeResponse());

    const tamperedResponse: CaseAnalysisResponse = {
      ...response,
      outputIntegrity: {
        ...response.outputIntegrity!,
        authorityRegistryIdentity: {
          ...response.outputIntegrity!.authorityRegistryIdentity,
          authorityRegistryDigest: "TAMPERED-AUTHORITY-DIGEST",
        },
      },
    };

    const result = verifyOutputIntegrity(tamperedResponse);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Output authorityRegistryDigest does not match RuleGraphIdentity.",
    );
  });

  it("fails when output authority registry identity is missing", () => {
    const response = finalizeOutputResponse(makeResponse());

    const tamperedResponse: CaseAnalysisResponse = {
      ...response,
      outputIntegrity: {
        ...response.outputIntegrity!,
        authorityRegistryIdentity: undefined as any,
      },
    };

    const result = verifyOutputIntegrity(tamperedResponse);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Missing output authority registry identity.",
    );
  });

  it("fails when RuleGraphIdentity is missing", () => {
    const response = finalizeOutputResponse(makeResponse());

    const tamperedResponse: CaseAnalysisResponse = {
      ...response,
      ruleGraphIdentity: undefined,
    };

    const result = verifyOutputIntegrity(tamperedResponse);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing RuleGraphIdentity.");
  });

  it("fails when output authority registry digest is empty", () => {
    const response = finalizeOutputResponse(makeResponse());

    const tamperedResponse: CaseAnalysisResponse = {
      ...response,
      outputIntegrity: {
        ...response.outputIntegrity!,
        authorityRegistryIdentity: {
          ...response.outputIntegrity!.authorityRegistryIdentity,
          authorityRegistryDigest: "",
        },
      },
    };

    const result = verifyOutputIntegrity(tamperedResponse);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Missing or invalid output authorityRegistryDigest.",
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
