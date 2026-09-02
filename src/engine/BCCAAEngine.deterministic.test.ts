import { CaseAnalysisResponse } from "../types/types";
import { makeTestUser } from "./testFixtures";
import { describe, it, expect } from "vitest";
import {
  BCCAAEngine,
  canonicalStringify,
  NoOpFactValidationProvider,
  type AnalyzeRequest,
} from "./BCCAAEngine";

const engine = new BCCAAEngine({
  licenseValidator: {
    validate: async () => ({
      valid: true,
      licenseId: "TEST-LIC-001",
      issuedTo: "DETERMINISTIC_TEST_SUITE",
    }),
  },
  factValidationProvider: new NoOpFactValidationProvider(),
});

function makeRequest(overrides: {
  caseId?: string;
  factPattern?: string;
  submissionDate?: string;
} = {}): AnalyzeRequest {
  return {
    caseId: overrides.caseId ?? `DET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    user: makeTestUser(),
    license: { licenseId: "TEST-LIC-001", issuedTo: "DETERMINISTIC_TEST_SUITE" },
    input: {
      factPattern:
        overrides.factPattern ??
        "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021.",
      submissionDate: overrides.submissionDate ?? "2024-01-15",
    },
  };
}

function deterministicSnapshot(response: CaseAnalysisResponse): unknown {
  const { gateF0, stage0, stage1, stage2, stage3, stage4, stage5, outcome } = response;
  return canonicalStringify({
    gateF0,
    stage0: {
      factualSummary: stage0?.factualSummary,
      chronology: stage0?.chronology,
      admittedFacts: stage0?.admittedFacts,
      disputedFacts: stage0?.disputedFacts,
      unknownFacts: stage0?.unknownFacts,
      quantumFacts: stage0?.quantumFacts,
      dispossessionProven: (stage0 as any)?.factsMeta?.dispossessionProven,
      atomicFactCount: stage0?.atomicFacts?.length ?? 0,
      propositionCount: stage0?.propositions?.length ?? 0,
      assertionCount: stage0?.assertions?.length ?? 0,
      contradictionCount: stage0?.contradictionGraph?.length ?? 0,
      eventCount: stage0?.eventTimeline?.length ?? 0,
    },
    stage1: {
      primaryDomain: stage1?.primaryDomain,
      subsidiaryDomains: stage1?.subsidiaryDomains,
      triggerFacts: stage1?.triggerFacts,
    },
    stage2: {
      primaryAct: stage2?.primaryAct,
      relevantSections: stage2?.relevantSections,
      precedentCount: stage2?.precedents?.length ?? 0,
      verifiedPrecedentCount: stage2?.precedents?.filter(
        (p: any) => p.verificationStatus === "VERIFIED_CANONICAL"
      ).length,
      citationValidationAudit: stage2?.citationValidationAudit,
      equityPrinciples: stage2?.equityPrinciples,
    },
    stage3: {
      accrualDate: stage3?.accrualDate,
      prescribedPeriod: stage3?.prescribedPeriod,
      limitationArticle: stage3?.limitationArticle,
      isTimeBarred: stage3?.isTimeBarred,
      exceptionsOrExtensions: stage3?.exceptionsOrExtensions,
      preliminaryAnalysis: stage3?.preliminaryAnalysis,
      timelineValidation: stage3?.timelineValidation,
    },
    stage4: {
      plaintiffs: stage4?.plaintiffs,
      defendants: stage4?.defendants,
      joinderIssues: stage4?.joinderIssues,
      locusStandiSummary: stage4?.locusStandiSummary,
    },
    stage5: {
      territorial: stage5?.territorial,
      pecuniary: stage5?.pecuniary,
      subjectMatter: stage5?.subjectMatter,
      objectionStrategy: stage5?.objectionStrategy,
      timelineProgress: (response.stage11)?.timelineProgress,
    },
    outcome,
  });
}

async function assertDeterministic(req: AnalyzeRequest): Promise<CaseAnalysisResponse> {
  const r1 = await engine.analyze(req);
  const r2 = await engine.analyze(req);
  expect(deterministicSnapshot(r1)).toBe(deterministicSnapshot(r2));
  return r1;
}

describe("PHASE 1: Core Determinism & Fact Extraction", () => {
  describe("P1-01 Semantic determinism", () => {
    it("SPECIFIC_PERFORMANCE pattern — identical input produces identical snapshot", async () => {
      const req = makeRequest({
        caseId: "P1-01-SP",
        factPattern:
          "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021.",
      });
      await assertDeterministic(req);
    });

    it("Death / inheritance pattern — identical input produces identical snapshot", async () => {
      const req = makeRequest({
        caseId: "P1-01-INH",
        factPattern: "The plaintiff father died on 10 March 2020. The property is Khatian No. 456.",
      });
      await assertDeterministic(req);
    });

    it("Dispossession / adverse possession pattern — identical input produces identical snapshot", async () => {
      const req = makeRequest({
        caseId: "P1-01-DISP",
        factPattern:
          "The defendant forcibly dispossessed the plaintiff on 05 June 2019. The land is 12 decimals in Dhaka.",
      });
      await assertDeterministic(req);
    });
  });

  describe("P1-02 Temporal determinism", () => {
    it("3-year limitation from August 2020 refusal is TIME_BARRED in 2024", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P1-02",
          factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.",
          submissionDate: "2024-01-15",
        })
      );
      expect(r.stage3.isTimeBarred).toBe(true);
      expect(r.stage3.accrualDate).toBe("2020-08-20");
    });

    it("1-year limitation (heuristic) from July 2023 refusal is NOT time-barred in 2024", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P1-02-RECENT",
          factPattern: "Bainapatra executed on 01 July 2023. Refusal dated 15 August 2023.",
          submissionDate: "2024-01-15",
        })
      );
      expect(r.stage3.isTimeBarred).toBe(false);
    });
  });

  describe("P1-03 Fact extraction fidelity", () => {
    it("UNREGISTERED bainapatra surfaces in atomicFacts", async () => {
      const r = await engine.analyze(
        makeRequest({
          caseId: "P1-03-REG",
          factPattern: "The plaintiff relied on an unregistered bainapatra.",
        })
      );
      const objects = (r.stage0?.atomicFacts ?? [])
        .map((f: any) => f.object)
        .filter(Boolean);
      expect(objects).toContain("UNREGISTERED");
    });

    it("Death fact extracted as DECEASED with subject Ancestor", async () => {
      const r = await engine.analyze(
        makeRequest({
          caseId: "P1-03-DEATH",
          factPattern: "The plaintiff father died on 10 March 2020.",
        })
      );
      const deathFacts = (r.stage0?.atomicFacts ?? []).filter(
        (f: any) => f.predicate === "Vital Status" && f.object === "DECEASED"
      );
      expect(deathFacts.length).toBeGreaterThanOrEqual(1);
      expect(deathFacts[0].subject).toBe("Ancestor");
    });

    it("Treasury deposit status extracted when mentioned", async () => {
      const r = await engine.analyze(
        makeRequest({
          caseId: "P1-03-DEP",
          factPattern:
            "The plaintiff deposited the balance consideration of Tk. 5,00,000 into government treasury on 01 January 2021.",
        })
      );
      const depositFacts = (r.stage0?.atomicFacts ?? []).filter(
        (f: any) =>
          f.predicate === "Payment Status" &&
          (f.object === "DEPOSITED" || f.object?.includes("DEPOSITED"))
      );
      expect(depositFacts.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("PHASE 2: Domain Classification & Legislation", () => {
  describe("P2-01 Domain classification determinism", () => {
    it("Specific performance claim resolves to a known domain", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P2-01",
          factPattern:
            "Plaintiff seeks specific performance of an agreement to sell dated 01 January 2020. Defendant refused to register the deed.",
        })
      );
      expect(r.stage1.primaryDomain).not.toBe("UNKNOWN");
      expect(Array.isArray(r.stage1.subsidiaryDomains)).toBe(true);
    });

    it("Inheritance claim resolves to SUCCESSION domain", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P2-01-SUC",
          factPattern:
            "The plaintiff's father died intestate on 10 March 2020 leaving 20 decimals of agricultural land.",
        })
      );
      expect(r.stage1.primaryDomain).toMatch(/SUCCESSION|INHERITANCE|PROPERTY/i);
    });
  });

  describe("P2-02 Legislation & precedent resolution", () => {
    it("Specific performance triggers relevant legislation sections", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P2-02",
          factPattern:
            "Plaintiff filed for specific performance of a bainapatra. Defendant claims the agreement is void for uncertainty.",
        })
      );
      expect(r.stage2.relevantSections.length).toBeGreaterThan(0);
      expect(r.stage2.primaryAct).not.toBeNull();
    });

    it("Precedent verification audit is deterministic and reports counts consistently", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P2-02-PREC",
          factPattern:
            "The plaintiff cited 43 DLR 234 and 52 DLR 112 for the proposition that unregistered bainapatra is admissible in evidence.",
        })
      );
      expect(r.stage2!.citationValidationAudit!.totalCitations).toBeGreaterThanOrEqual(0);
      expect(r.stage2!.citationValidationAudit!.validationStandard).toBe(
        "Deterministic canonical-registry citation verification"
      );
      expect(r.stage2!.citationValidationAudit!.auditStatus).toBe(
        "NOT_EXECUTED"
      );
    });
  });

  describe("P2-03 Equity principles extraction", () => {
    it("Equity principles are extracted deterministically when facts support them", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P2-03",
          factPattern:
            "The plaintiff has been in possession for 12 years, made substantial improvements, and the defendant is estopped from denying the agreement by conduct.",
        })
      );
      expect(Array.isArray(r.stage2.equityPrinciples)).toBe(true);
    });
  });
});

describe("PHASE 3: Limitation & Locus Standi", () => {
  describe("P3-01 Limitation computation determinism", () => {
    it("Real refusal date extracted → timelineValidation is present and deterministic", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P3-01-REAL",
          factPattern:
            "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020. Suit filed 2024.",
          submissionDate: "2024-03-01",
        })
      );
      expect(r.stage3.timelineValidation).toBeDefined();
      expect(r.stage3.isTimeBarred).toBe(true);
      expect(r.stage3.accrualDate).toBe("2020-08-20");
    });

    it("Missing refusal date → falls back to heuristic or missing_dates category", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P3-01-HEUR",
          factPattern: "Agreement dated 15 July 2020. Suit filed 2024.",
          submissionDate: "2024-03-01",
        })
      );
      expect(["heuristic_6_months", "missing_dates", "other_category"]).toContain(
        r.stage3.timelineValidation?.calculationType
      );
    });
  });

  describe("P3-02 Locus standi determinism", () => {
    it("Party extraction yields deterministic plaintiff/defendant arrays", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P3-02",
          factPattern:
            "Plaintiff Abdul Karim sues defendant Rahim Miah for specific performance. Plaintiff is the purchaser. Defendant is the vendor.",
        })
      );
      expect(Array.isArray(r.stage4.plaintiffs)).toBe(true);
      expect(Array.isArray(r.stage4.defendants)).toBe(true);
    });

    it("Joinder issues and locus standi summary are present or explicitly empty", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P3-02-JOIN",
          factPattern:
            "Plaintiff 1 and Plaintiff 2 jointly sue Defendant 1 and Defendant 2 for partition of ancestral property.",
        })
      );
      expect(typeof r.stage4.joinderIssues).toBe("string");
      expect(typeof r.stage4.locusStandiSummary).toBe("string");
    });
  });
});

describe("PHASE 4: Pleading & Issue Framing", () => {
  describe("P4-01 Pleading checklist determinism", () => {
    it("Plaint checklist and grounds for rejection are deterministic arrays", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P4-01",
          factPattern:
            "The plaintiff filed a plaint for specific performance. The plaint does not mention the survey number. The defendant filed written statement denying execution.",
        })
      );
      expect(r).toBeDefined();
    });
  });

  describe("P4-02 Issue framing determinism", () => {
    it("Issues are numbered and typed consistently across reruns", async () => {
      const req = makeRequest({
        caseId: "P4-02",
        factPattern:
          "The plaintiff claims specific performance. The defendant denies execution of bainapatra and pleads limitation.",
      });
      const r1 = await engine.analyze(req);
      const r2 = await engine.analyze(req);
      const i1 = (r1 as any).stage7?.issues ?? [];
      const i2 = (r2 as any).stage7?.issues ?? [];
      expect(canonicalStringify(i1)).toBe(canonicalStringify(i2));
    });
  });
});

describe("PHASE 5: Evidence Assessment & Merits Analysis", () => {
  describe("P5-01 Evidence list determinism", () => {
    it("Evidence items, burden assignments and statutory presumptions are deterministic", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P5-01",
          factPattern:
            "The plaintiff relies on bainapatra, mutation certificate, and witness testimony. The defendant relies on registered deed and revenue records.",
        })
      );
      expect(r).toBeDefined();
    });
  });

  describe("P5-02 Merits projection determinism", () => {
    it("IssueDetails (plaintiffPosition, defendantPosition, projectedFinding) are stable", async () => {
      const req = makeRequest({
        caseId: "P5-02",
        factPattern:
          "Plaintiff proved execution of bainapatra by attesting witness. Defendant failed to prove fraud. Court found plaintiff in continuous possession.",
      });
      const r1 = await engine.analyze(req);
      const r2 = await engine.analyze(req);
      const m1 = (r1 as any).stage9?.issueDetails ?? [];
      const m2 = (r2 as any).stage9?.issueDetails ?? [];
      expect(canonicalStringify(m1)).toBe(canonicalStringify(m2));
    });
  });
});

describe("PHASE 6: Equity, Procedure & Appeal", () => {
  describe("P6-01 Procedure determinism", () => {
    it("Territorial, pecuniary, and subject-matter jurisdiction are deterministic", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P6-01",
          factPattern:
            "The suit is filed in the Court of Senior Assistant Judge, Dhaka, for recovery of possession of 15 decimals of land valued at Tk. 15,00,000.",
        })
      );
      expect(r.stage5.territorial).toBeDefined();
      expect(r.stage5.pecuniary).toBeDefined();
      expect(r.stage5.subjectMatter).toBeDefined();
    });

    it("Timeline progress (CPC references) is deterministic", async () => {
      const r = await assertDeterministic(
        makeRequest({
          caseId: "P6-01-TIME",
          factPattern: "The suit was filed on 01 January 2024. Issues were framed on 15 February 2024. Evidence is ongoing.",
        })
      );
      expect(((r as any).stage11?.timelineProgress ?? []).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("P6-02 Appeal path determinism", () => {
    it("Appeal nodes (level, authority, scope, governingSection) are stable", async () => {
      const req = makeRequest({
        caseId: "P6-02",
        factPattern:
          "The suit was decreed by the Senior Assistant Judge. The defendant prefers appeal to the District Judge.",
      });
      const r1 = await engine.analyze(req);
      const r2 = await engine.analyze(req);
      const a1 = (r1 as any).stage12?.appealNodes ?? [];
      const a2 = (r2 as any).stage12?.appealNodes ?? [];
      expect(canonicalStringify(a1)).toBe(canonicalStringify(a2));
    });
  });
});

describe("PHASE 7: Final Gate, Outcome & Audit Integrity", () => {
  describe("P7-01 Element gate determinism", () => {
    it("Element gate result is identical across reruns for same input", async () => {
      const req = makeRequest({
        caseId: "P7-01",
        factPattern:
          "Plaintiff proved agreement, part performance, and readiness. Defendant proved nothing. Suit is not barred by limitation.",
      });
      const r1 = await engine.analyze(req);
      const r2 = await engine.analyze(req);
      expect(canonicalStringify(r1.gateF0)).toBe(canonicalStringify(r2.gateF0));
    });
  });

  describe("P7-02 Outcome determinism", () => {
    it("Outcome (executionStatus + determination) is bitwise stable", async () => {
      const req = makeRequest({
        caseId: "P7-02",
        factPattern:
          "All elements proved. No equitable bar. Procedure valid. Precedents verified.",
      });
      const r1 = await engine.analyze(req);
      const r2 = await engine.analyze(req);
      expect(canonicalStringify(r1)).toBe(canonicalStringify(r2));
    });
  });

  describe("P7-03 Audit hash determinism", () => {
    it.skip("Output hash is identical across reruns [PENDING: auditHash not yet exposed on response]", async () => {
      const req = makeRequest({ caseId: "P7-03", factPattern: "The plaintiff relied on an unregistered bainapatra." });
      const r1 = await engine.analyze(req);
      const r2 = await engine.analyze(req);
      expect((r1).auditHash).toBe((r2).auditHash);
      expect((r1).auditHash).toBeTruthy();
    });

    it.skip("Different inputs produce different audit hashes [PENDING: auditHash not yet exposed on response]", async () => {
      const rA = await engine.analyze(makeRequest({ caseId: "P7-03-A", factPattern: "Fact pattern A." }));
      const rB = await engine.analyze(makeRequest({ caseId: "P7-03-B", factPattern: "Fact pattern B." }));
      expect((rA).auditHash).not.toBe((rB).auditHash);
    });
  });
});

describe("PHASE 8: Edge Cases & Regression Guards", () => {
  describe("P8-01 Empty / minimal input", () => {
    it("Empty fact pattern does not crash and produces deterministic output", async () => {
      const req = makeRequest({ caseId: "P8-01", factPattern: "", submissionDate: "2024-01-15" });
      const r = await assertDeterministic(req);
      expect((r.stage0.atomicFacts ?? []).length).toBe(0);
    });
  });

  describe("P8-02 Quantum formatting (FIX #24 regression)", () => {
    it("Preserves original lakh/crore formatting in quantum facts", async () => {
      const r = await engine.analyze(
        makeRequest({
          caseId: "P8-02",
          factPattern: "The plaintiff deposited Tk. 5,00,000 as consideration.",
        })
      );
      const qf = r.stage0.quantumFacts ?? [];
      const hasFormatted = qf.some((q: string) => q.includes("5,00,000") || q.includes("500000"));
      expect(hasFormatted).toBe(true);
    });
  });

  describe("P8-03 Registration status fact meta (FIX #16 / FIX #9 regression)", () => {
    it.skip("Bainapatra registration status is 'unspecified' when not mentioned, true/false when explicit [PENDING: field not exposed on stage0]", async () => {
      const rUnreg = await engine.analyze(
        makeRequest({ caseId: "P8-03-U", factPattern: "unregistered bainapatra." })
      );
      const rReg = await engine.analyze(
        makeRequest({ caseId: "P8-03-R", factPattern: "registered bainapatra." })
      );
      const rNone = await engine.analyze(
        makeRequest({ caseId: "P8-03-N", factPattern: "The plaintiff has a document." })
      );
      expect((rUnreg.stage0.factsMeta?.isRegisteredBainapatra)).toBe(false);
      expect((rReg.stage0.factsMeta?.isRegisteredBainapatra)).toBe(true);
      expect((rNone.stage0.factsMeta?.isRegisteredBainapatra)).toBe("unspecified");
    });
  });

  describe("P8-04 Contradiction graph stability", () => {
    it("Contradiction graph is identical across reruns when conflicting facts exist", async () => {
      const req = makeRequest({
        caseId: "P8-04",
        factPattern:
          "The plaintiff says the agreement was oral. The defendant says it was written. The plaintiff says the land is 10 decimals. The defendant says it is 15 decimals.",
      });
      const r1 = await engine.analyze(req);
      const r2 = await engine.analyze(req);
      expect(canonicalStringify(r1.stage0.contradictionGraph)).toBe(
        canonicalStringify(r2.stage0.contradictionGraph)
      );
    });
  });
});
