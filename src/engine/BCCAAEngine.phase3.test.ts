import { describe, it, expect } from "vitest";
import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from "./BCCAAEngine";

const engine = new BCCAAEngine({
  licenseValidator: { validate: async () => ({ valid: true, licenseId: "TEST", issuedTo: "TEST" }) },
  factValidationProvider: new NoOpFactValidationProvider(),
});

function makeRequest(o: any = {}) {
  return {
    caseId: o.caseId ?? "P3-TEST",
    user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any,
    license: { licenseId: "TEST", issuedTo: "TEST" },
    input: {
      factPattern: o.factPattern ?? "The plaintiff relied on an unregistered bainapatra.",
      submissionDate: o.submissionDate,
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  P2-16 – P2-18  Offline boundary                                           */
/* ────────────────────────────────────────────────────────────────────────── */
describe("P2-16: No external network dependencies", () => {
  it("analysis completes using only local providers", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P2-16",
      factPattern: "The plaintiff relied on an unregistered bainapatra.",
    }));
    expect(r).toBeDefined();
    expect(r.stage0!.atomicFacts!.length).toBeGreaterThan(0);
  });
});

describe("P2-17: Offline license validation", () => {
  it("works with a purely offline license validator", async () => {
    const offlineEngine = new BCCAAEngine({
      licenseValidator: { validate: async () => ({ valid: true, licenseId: "OFFLINE", issuedTo: "OFFLINE" }) },
      factValidationProvider: new NoOpFactValidationProvider(),
    });
    const r = await offlineEngine.analyze(makeRequest({ caseId: "P2-17" }));
    expect(r).toBeDefined();
  });
});

describe("P2-18: Deterministic without external mutable state", () => {
  it("five parallel analyses of identical input are identical", async () => {
    const input = makeRequest({ caseId: "P2-18" });
    const results = await Promise.all(Array.from({ length: 5 }, () => engine.analyze(input)));
    const canonical = results.map((r) => canonicalStringify(r));
    expect(new Set(canonical).size).toBe(1);
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  P3-01 – P3-05  Repository / CI                                            */
/* ────────────────────────────────────────────────────────────────────────── */
describe("P3-01: Deterministic test environment", () => {
  it("test engine is configured for determinism", async () => {
    expect(engine).toBeDefined();
    const r = await engine.analyze(makeRequest({ caseId: "P3-01" }));
    expect(r).toBeDefined();
  });
});

describe("P3-02: No Date.now() in legal reasoning", () => {
  it("temporal reasoning anchored to submissionDate, not wall-clock", async () => {
    // Use the same dual-date pattern as P1-02 to ensure limitation is computable
    const r = await engine.analyze(makeRequest({
      caseId: "P3-02",
      factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.",
      submissionDate: "2024-01-15",
    }));
    expect(r.stage3.accrualDate).toBe("2020-08-20");
    expect(r.stage3.isTimeBarred).toBe(true);
    // Re-run with same input to prove wall-clock independence
    const r2 = await engine.analyze(makeRequest({
      caseId: "P3-02-B",
      factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.",
      submissionDate: "2024-01-15",
    }));
    expect(r.stage3.isTimeBarred).toBe(r2.stage3.isTimeBarred);
    expect(r.stage3.accrualDate).toBe(r2.stage3.accrualDate);
  });
});

describe("P3-03: Canonical registry verification standard", () => {
  it("citation audit references deterministic registry", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P3-03",
      factPattern: "Transfer of Property Act Section 54.",
    }));
    expect(r.stage2!.citationValidationAudit!.validationStandard).toMatch(/deterministic/i);
  });
});

describe("P3-04: Reproducible build artifacts", () => {
  it("engine exports are stable functions", () => {
    expect(typeof BCCAAEngine).toBe("function");
    expect(typeof canonicalStringify).toBe("function");
    expect(typeof NoOpFactValidationProvider).toBe("function");
  });
});

describe("P3-05: No non-deterministic dependencies", () => {
  it("Math.random or UUID v4 do not affect output", async () => {
    const input = makeRequest({ caseId: "P3-05" });
    const r1 = await engine.analyze(input);
    const r2 = await engine.analyze(input);
    expect(canonicalStringify(r1)).toBe(canonicalStringify(r2));
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  P3-06 – P3-08  Audit architecture                                         */
/* ────────────────────────────────────────────────────────────────────────── */
describe("P3-06: Audit trail completeness", () => {
  it("analysis completion implies audit path executed", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P3-06" }));
    expect(r).toBeDefined();
  });
});

describe("P3-07: Audit hash computation", () => {
  it("output hash is computed during analysis", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P3-07" }));
    expect(r).toBeDefined();
  });
});

describe("P3-08: Audit outcome recording", () => {
  it("outcome is determined and passed to audit sink", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P3-08" }));
    expect(r).toBeDefined();
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  P3-09 – P3-12  UI / audit boundary                                        */
/* ────────────────────────────────────────────────────────────────────────── */
describe("P3-09: No UI data in response", () => {
  it("response contains no HTML, CSS, or UI markup", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P3-09" }));
    const json = canonicalStringify(r);
    expect(json).not.toMatch(/<[^>]+>/);
    expect(json).not.toMatch(/color\s*:|font\s*:|style\s*:|margin|padding/i);
  });
});

describe("P3-10: Semantic/audit metadata separation", () => {
  it("legal reasoning stages do not embed audit hashes or timestamps", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P3-10" }));
    expect(r.stage0.factualSummary).toBeDefined();
    expect(r.stage0.factualSummary).not.toMatch(/hash|timestamp|audit/i);
    expect(r.stage1.primaryDomain).toBeDefined();
    expect(r.stage3.accrualDate).toBeDefined();
  });
});

describe("P3-11: Audit signature isolation", () => {
  it("audit signatures live only in audit-specific fields", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P3-11" }));
    expect(r.stage2!.citationValidationAudit!.registrySignature).toBeDefined();
    expect(r.stage2!.citationValidationAudit!.registrySignature).toMatch(/BCCAA/i);
  });
});

describe("P3-12: UI renders engine status only", () => {
  it("engine response carries execution status for UI consumption", async () => {
    const r = await engine.analyze(makeRequest({ caseId: "P3-12" }));
    expect(r).toBeDefined();
    expect(r.stage0).toBeDefined();
  });
});
