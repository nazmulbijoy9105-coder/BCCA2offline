import { describe, it, expect, beforeEach } from "vitest";
import { BCCAAEngine } from "./BCCAAEngine";

const mockRegistry = {
  getClaimElements: () => [],
  getLegislationMapping: () => [],
  identity: { name: "test", version: "1.0.0", effectiveDate: "2024-01-01", checksum: "abc123" },
  authorityStatus: "DEVELOPMENT_FIXTURE" as const,
  rules: [],
  precedenceOrder: [],
};

const mockAuditSink = {
  append: async () => {},
  atomicAppend: true,
  durable: true,
  concurrencySafe: true,
};

const mockValidator = {
  validateFacts: async ({ facts }: any) => facts.map((f: any) => ({
    ...f,
    validationStatus: "VERIFIED" as const,
    confidence: "VERIFIED" as const,
    validation: {
      extractionStatus: "EXTRACTED" as const,
      sourceStatus: "SOURCE_VERIFIED" as const,
      authenticationStatus: "AUTHENTICATED" as const,
      corroborationStatus: "CORROBORATED" as const,
      humanValidationStatus: "VALIDATED" as const,
    },
  })),
};

function stripNonDeterministic(result: any): any {
  const cleaned = JSON.parse(JSON.stringify(result));
  if (cleaned._security) {
    delete cleaned._security.analyzedAt;
    delete cleaned._security.caseId;
    delete cleaned._security.forensicHash;
  }
  if (cleaned.stage2?.citationValidationAudit) {
    delete cleaned.stage2.citationValidationAudit.registrySignature;
  }
  return cleaned;
}

function makeRequest(overrides: any) {
  return {
    user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TESTER" as any as any as any, chamberId: "test-chamber" } as any,
    license: { licenseId: "test-license", issuedTo: "Test" },
    input: {
      caseId: "TEST",
      claimType: "SUCCESSION_CERTIFICATE",
      jurisdiction: "BANGLADESH",
      factPattern: "Deceased died on 1 January 2023.",
      ...overrides,
    },
  };
}

describe("C2: ILRMF Guarantee Tests", () => {
  let engine: BCCAAEngine;

  beforeEach(() => {
    engine = new BCCAAEngine({
      ruleRegistry: mockRegistry as any,
      auditSink: mockAuditSink as any,
      factValidationProvider: mockValidator as any,
      licenseValidator: { validate: async () => ({ valid: true, tier: "FULL" }) },
    });
  });

  it("determinism: identical input produces identical output", async () => {
    const input = makeRequest({
      caseId: "DET-001",
      factPattern: "Deceased John Doe died on 15 January 2023. The bainapatra was executed on 20 February 2023 and registered with the sub-registrar.",
    });
    const r1 = await engine.analyze(input);
    const r2 = await engine.analyze(input);
    expect(stripNonDeterministic(r2)).toEqual(stripNonDeterministic(r1));
  });

  it("fail-closed: EMPTY_INPUT triggers HALT (fail-safe rejection)", async () => {
    const r = await engine.analyze({
      user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TESTER" as any as any as any, chamberId: "test-chamber" } as any,
      license: { licenseId: "test-license", issuedTo: "Test" },
      input: {
        caseId: "HALT-EMPTY",
        claimType: "SUCCESSION_CERTIFICATE",
        jurisdiction: "BANGLADESH",
        factPattern: "",
      },
    });
    expect(r.stage13.overview).toContain("HALTED");
    expect(r.stage13.overview).toContain("EMPTY_INPUT");
  });

  it("fiduciary boundary: SUCCESS never emitted in any output", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "FID-001",
      factPattern: "Deceased died on 1 June 2023. Bainapatra executed and registered. Treasury deposit made.",
    }));
    expect(JSON.stringify(r)).not.toContain('"SUCCESS"');
  });

  it("no external calls: works offline with mocks only", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "OFFLINE-001",
    }));
    expect(r).toHaveProperty("stage0");
    expect(r).toHaveProperty("stage13");
    expect(r._security.engineVersion).toBe("4.5.1-Hardened");
  });
});

describe("H3: UNREGISTERED extraction patterns", () => {
  let engine: BCCAAEngine;

  beforeEach(() => {
    engine = new BCCAAEngine({
      ruleRegistry: mockRegistry as any,
      auditSink: mockAuditSink as any,
      factValidationProvider: mockValidator as any,
      licenseValidator: { validate: async () => ({ valid: true, tier: "FULL" }) },
    });
  });

  function getExtractedObjects(result: any, predicate: string): string[] {
    return (result.stage0?.atomicFacts ?? [])
      .filter((f: any) => f.predicate === predicate)
      .map((f: any) => f.object);
  }

  it("extracts UNREGISTERED from 'unregistered bainapatra'", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "H3-1",
      claimType: "SPECIFIC_PERFORMANCE",
      factPattern: "The plaintiff relied on an unregistered bainapatra.",
    }));
    expect(getExtractedObjects(r, "Registration Status")).toContain("UNREGISTERED");
  });

  it("extracts UNREGISTERED from 'bainapatra not registered'", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "H3-2",
      claimType: "SPECIFIC_PERFORMANCE",
      factPattern: "The bainapatra was not registered with the sub-registrar.",
    }));
    expect(getExtractedObjects(r, "Registration Status")).toContain("UNREGISTERED");
  });

  it("extracts UNREGISTERED from 'without registration' near 'bainapatra'", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "H3-3",
      claimType: "SPECIFIC_PERFORMANCE",
      factPattern: "The bainapatra was executed without registration.",
    }));
    expect(getExtractedObjects(r, "Registration Status")).toContain("UNREGISTERED");
  });

  it("extracts UNREGISTERED from 'agreement registration not done' (single clause)", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "H3-4",
      claimType: "SPECIFIC_PERFORMANCE",
      factPattern: "Agreement registration not done.",
    }));
    expect(getExtractedObjects(r, "Registration Status")).toContain("UNREGISTERED");
  });

  it("extracts UNREGISTERED from 'unregistered sale deed'", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "H3-5",
      claimType: "SPECIFIC_PERFORMANCE",
      factPattern: "The plaintiff produced an unregistered sale deed.",
    }));
    expect(getExtractedObjects(r, "Registration Status")).toContain("UNREGISTERED");
  });

  it("extracts REGISTERED from 'registered bainapatra' (not UNREGISTERED)", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "H3-6",
      claimType: "SPECIFIC_PERFORMANCE",
      factPattern: "The registered bainapatra was duly stamped and executed.",
    }));
    const regStatuses = getExtractedObjects(r, "Registration Status");
    expect(regStatuses).toContain("REGISTERED");
    expect(regStatuses).not.toContain("UNREGISTERED");
  });
});
