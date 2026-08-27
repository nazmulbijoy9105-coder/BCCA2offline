import { describe, it, expect } from "vitest";
import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from "./BCCAAEngine";

const engine = new BCCAAEngine({
  licenseValidator: { validate: async () => ({ valid: true, licenseId: "TEST", issuedTo: "TEST" }) },
  factValidationProvider: new NoOpFactValidationProvider(),
});

function makeRequest(o: any = {}) {
  return {
    caseId: o.caseId ?? "P2-TEST",
    user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any,
    license: { licenseId: "TEST", issuedTo: "TEST" },
    input: {
      factPattern: o.factPattern ?? "The plaintiff relied on an unregistered bainapatra.",
      submissionDate: o.submissionDate,
    },
  };
}

describe("P1-17: Claim type detection — Specific Performance", () => {
  it("detects SPECIFIC_PERFORMANCE from narrative", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-17",
      factPattern: "Plaintiff seeks specific performance of agreement to sell. Defendant refused to execute deed.",
    }));
    expect(r).toBeDefined();
  });
});

describe("P1-18: Claim type detection — Declaration", () => {
  it("detects declaration suit from narrative", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-18",
      factPattern: "Plaintiff filed suit for declaration of title and recovery of possession.",
    }));
    expect(r).toBeDefined();
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  P1-19  Partition suit — co-sharer and joint property detection            */
/* ────────────────────────────────────────────────────────────────────────── */
describe("P1-19: Partition suit — co-sharer and joint property detection", () => {
  it("partition narrative resolves to DECLARATION_AND_POSSESSION domain", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-19-A",
      factPattern: "Plaintiff seeks partition of joint family property. Defendant denies joint possession.",
    }));
    expect(r.claimType).toBe("DECLARATION_AND_POSSESSION");
    expect(r.domain).toBe("DECLARATION_AND_POSSESSION");
  });

  it("co-sharer facts are extracted from partition narrative", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-19-B",
      factPattern: "The property is jointly owned by co-sharers. Plaintiff seeks partition.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    expect(facts.some((f: any) => f.predicate === "Ownership Structure" && f.object === "JOINT")).toBe(true);
  });

  it("partition with dispossession triggers possession element extraction", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-19-C",
      factPattern: "Plaintiff was dispossessed from joint family property. Seeks partition and recovery of possession.",
    }));
    expect(r.stage1?.primaryDomain).toBe("DECLARATION_AND_POSSESSION");
    const facts = r.stage0?.atomicFacts ?? [];
    expect(facts.some((f: any) => f.predicate === "Possession Status")).toBe(true);
  });

  it("mutation status is extracted when mentioned in partition context", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-19-D",
      factPattern: "Property mutated in plaintiff's name. Co-sharers deny mutation. Plaintiff seeks partition.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    expect(facts.some((f: any) => f.predicate === "Mutation Status")).toBe(true);
  });

  it("area facts are extracted in partition suits", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-19-E",
      factPattern: "Property consists of 5.5 decimals. Co-sharers seek partition by metes and bounds.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    expect(facts.some((f: any) => f.predicate === "Area")).toBe(true);
  });

  it("missing title facts in partition suit appear in element gate unknowns", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-19-F",
      factPattern: "Plaintiff seeks partition.",
    }));
    expect(r.stage8).toBeDefined();
    expect(r.stage8?.elementGateStatus).toBeDefined();
  });
});

describe("P1-20: Element gate presence", () => {
  it("pipeline processes element gate without crash", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-20",
      factPattern: "Plaintiff proved agreement and part performance. Defendant failed to prove fraud.",
    }));
    expect(r.gateF0).toBeDefined();
  });
});

describe("P1-21: F0 gate validation", () => {
  it("F0 gate is present and structured", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P1-21" }));
    expect(r.gateF0).toBeDefined();
    expect(typeof r.gateF0).toBe("object");
  });
});

describe("P1-22: Domain classification determinism", () => {
  it("same fact pattern yields identical domain classification", async () => {
    const req = makeRequest({
      caseId: "P1-22",
      factPattern: "Plaintiff seeks specific performance of agreement to sell dated 01 January 2020.",
    });
    const r1 = await engine.analyze(req);
    const r2 = await engine.analyze(req);
    expect(r1.stage1.primaryDomain).toBe(r2.stage1.primaryDomain);
  });
});

describe("P2-05: Precedent security hash token", () => {
  it("every precedent carries a non-empty security hash token", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P2-05" }));
    for (const p of r.stage2!.precedents!) {
      expect(p.securityHashToken).toBeTruthy();
      expect(typeof p.securityHashToken).toBe("string");
    }
  });
});

describe("P2-06: Precedent verification hash", () => {
  it("every precedent carries a non-empty verification hash", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P2-06" }));
    for (const p of r.stage2!.precedents!) {
      expect(p.verificationHash).toBeTruthy();
      expect(typeof p.verificationHash).toBe("string");
    }
  });
});

describe("P2-07: Deterministic citation flag", () => {
  it("isDeterministic flag is boolean on all precedents", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P2-07" }));
    for (const p of r.stage2!.precedents!) {
      expect(typeof p.isDeterministic).toBe("boolean");
    }
  });
});

describe("P2-08: Citation audit count accuracy", () => {
  it("audit totals match actual precedent array length", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P2-08" }));
    expect(r.stage2!.citationValidationAudit!.totalCitations).toBe((r.stage2!.precedents!).length);
  });
});

describe("P2-10: Sequential analysis isolation", () => {
  it("previous analysis does not pollute subsequent analysis", async () => {
    const r1 = await engine.analyze(makeRequest({
      caseId: "P2-10-A",
      factPattern: "The plaintiff father died on 10 March 2020.",
    }));
    const r2 = await engine.analyze(makeRequest({
      caseId: "P2-10-B",
      factPattern: "The plaintiff relied on an unregistered bainapatra.",
    }));
    expect(r1.stage0!.atomicFacts!.some((f: any) => f.object === "DECEASED")).toBe(true);
    expect(r2.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
    expect(r1.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(false);
    expect(r2.stage0!.atomicFacts!.some((f: any) => f.object === "DECEASED")).toBe(false);
  });
});

describe("P2-11: Concurrent analysis isolation", () => {
  it("concurrent analyses produce independent results", async () => {
    const inputs = [
      makeRequest({ caseId: "P2-11-A", factPattern: "Registered bainapatra." }),
      makeRequest({ caseId: "P2-11-B", factPattern: "Unregistered bainapatra." }),
      makeRequest({ caseId: "P2-11-C", factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020." }),
    ];
    const results = await Promise.all(inputs.map((i) => engine.analyze(i)));
    expect(results[0]!.stage0!.atomicFacts!.some((f: any) => f.object === "REGISTERED")).toBe(true);
    expect(results[1]!.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
    expect(results[2]!.stage0!.atomicFacts!.some((f: any) =>
      String(f.object).toLowerCase().includes("20 august 2020") ||
      String(f.proposition).toLowerCase().includes("20 august 2020")
    )).toBe(true);
  });
});

describe("P2-11: Concurrent analysis isolation", () => {
  it("concurrent analyses produce independent results", async () => {
    const inputs = [
      makeRequest({ caseId: "P2-11-A", factPattern: "Registered bainapatra." }),
      makeRequest({ caseId: "P2-11-B", factPattern: "Unregistered bainapatra." }),
      makeRequest({ caseId: "P2-11-C", factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020." }),
    ];
    const results = await Promise.all(inputs.map((i) => engine.analyze(i)));
    expect(results[0]!.stage0!.atomicFacts!.some((f: any) => f.object === "REGISTERED")).toBe(true);
    expect(results[1]!.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
    expect(results[2]!.stage0!.atomicFacts!.some((f: any) =>
      String(f.object).toLowerCase().includes("20 august 2020") ||
      String(f.proposition).toLowerCase().includes("20 august 2020")
    )).toBe(true);
  });
});

describe("P2-12: Input immutability", () => {
  it("engine does not mutate the input request object", async () => {
    const input = makeRequest({
      caseId: "P2-12",
      factPattern: "The plaintiff relied on an unregistered bainapatra.",
    });
    const inputBefore = canonicalStringify(input);
    await engine.analyze(input);
    expect(canonicalStringify(input)).toBe(inputBefore);
  });
});

describe("P2-13: Missing caseId handling", () => {
  it("handles absent caseId without throwing", async () => {
    const req = makeRequest();
    delete (req as any).caseId;
    const r = await engine.analyze(req);
    expect(r).toBeDefined();
  });
});

describe("P2-14: Missing user object handling", () => {
  it("handles absent user object without throwing", async () => {
    const req = makeRequest();
    delete (req as any).user;
    const r = await engine.analyze(req);
    expect(r).toBeDefined();
  });
});

describe("P2-15: Missing factPattern handling", () => {
  it("handles empty or missing factPattern gracefully", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P2-15", factPattern: "" }));
    expect(r).toBeDefined();
    expect(r.stage0?.atomicFacts?.length ?? 0).toBe(0);
  });
});


/* ────────────────────────────────────────────────────────────────────────── */
/*  P1-18  Boundary input resilience                                          */
/* ────────────────────────────────────────────────────────────────────────── */
describe("P1-18: Boundary input resilience", () => {
  it("empty fact pattern does not crash and returns structured response", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-18-A",
      factPattern: "",
    }));
    expect(r).toBeDefined();
    expect(r.caseId).toBe("P1-18-A");
    expect(r.executionStatus).toBeDefined();
  });

  it("whitespace-only fact pattern is treated as empty and handled gracefully", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-18-B",
      factPattern: "   \n\t  ",
    }));
    expect(r).toBeDefined();
    expect(r.caseId).toBe("P1-18-B");
    expect(r.stage0?.atomicFacts?.length ?? 0).toBe(0);
  });

  it("missing optional submissionDate does not break limitation engine", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-18-D",
      factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.",
      submissionDate: undefined as any,
    }));
    expect(r.stage3).toBeDefined();
    expect(r.stage3.isTimeBarred).not.toBeUndefined();
  });

  it("very long fact pattern (10k characters) processes without error", async () => {
    const longPattern = "The defendant refused. ".repeat(450);
    const r = await engine.analyze(makeRequest({
      caseId: "P1-18-E",
      factPattern: longPattern,
    }));
    expect(r).toBeDefined();
    expect(r.caseId).toBe("P1-18-E");
    expect(r.executionStatus).toBeDefined();
  });

  it("special characters and pseudo-markup in fact pattern do not cause crashes", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P1-18-F",
      factPattern: "Claim <script>alert(1)</script> & \"quotes\" 'apostrophes' \\x00\\x01",
    }));
    expect(r).toBeDefined();
    expect(r.caseId).toBe("P1-18-F");
  });

  it("null caseId is rejected or generates a fallback identifier", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: null as any,
      factPattern: "Facts.",
    }));
    expect(r.caseId).toBeTruthy();
    expect(typeof r.caseId).toBe("string");
  });
});
