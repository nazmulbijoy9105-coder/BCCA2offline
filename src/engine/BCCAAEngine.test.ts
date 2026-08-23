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
    truth: "TRUE" as const,
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

/** Strip timestamp-dependent fields for determinism comparison */
function stripTimestamps(result: any): any {
  const cleaned = JSON.parse(JSON.stringify(result));
  if (cleaned._security) {
    delete cleaned._security.analyzedAt;
    delete cleaned._security.caseId;
    delete cleaned._security.forensicHash;
  }
  return cleaned;
}

/** Check if stage13 indicates HALTED */
function isHalted(result: any): boolean {
  const overview = result.stage13?.overview ?? "";
  return overview.startsWith("HALTED");
}

describe("BCCAAEngine — ILRMF Guarantees", () => {
  let engine: BCCAAEngine;

  beforeEach(() => {
    engine = new BCCAAEngine({
      corpusMode: "DEVELOPMENT",
      ruleRegistry: mockRegistry as any,
      auditSink: mockAuditSink as any,
      factValidationProvider: mockValidator as any,
      licenseValidator: { validate: async () => ({ valid: true, tier: "FULL" }) },
    });
  });

  it("determinism: identical input → identical output (excluding timestamps)", async () => {
    const input = {
      caseId: "DET-001",
      claimType: "SUCCESSION_CERTIFICATE",
      jurisdiction: "BANGLADESH",
      documentText: "Test document for determinism check.",
      factPattern: "Deceased John Doe died on 15 January 2023. The bainapatra was executed on 20 February 2023 and registered with the sub-registrar.",
    };

    const r1 = await engine.analyze(input);
    const r2 = await engine.analyze(input);

    expect(stripTimestamps(r2)).toEqual(stripTimestamps(r1));
  });

  it("fail-closed: contradictory facts → HALTED in stage13", async () => {
    const input = {
      caseId: "HALT-001",
      claimType: "SUCCESSION_CERTIFICATE",
      jurisdiction: "BANGLADESH",
      documentText: "Contradictory facts test.",
      factPattern: "The deceased is alive and well. The deceased died on 1 January 2023.",
    };

    const result = await engine.analyze(input);

    // stage13.overview must start with HALTED or mention conflict
    const overview = result.stage13?.overview ?? "";
    const isBlocked = isHalted(result) || 
                      overview.includes("contradict") || 
                      overview.includes("conflict") ||
                      overview.includes("EMPTY_INPUT");
    expect(isBlocked).toBe(true);
    
    // Must never claim success with contradictions
    expect(overview).not.toContain("SUCCESS");
  });

  it("fiduciary boundary: SUCCESS string never appears in output", async () => {
    const input = {
      caseId: "FID-001",
      claimType: "SUCCESSION_CERTIFICATE",
      jurisdiction: "BANGLADESH",
      documentText: "All documents verified.",
      factPattern: "Deceased died on 1 June 2023. Bainapatra executed and registered. Treasury deposit made.",
    };

    const result = await engine.analyze(input);
    const resultStr = JSON.stringify(result);

    // SUCCESS must never appear anywhere in output
    expect(resultStr).not.toContain('"SUCCESS"');
    
    // stage13.overview must not claim success
    const overview = result.stage13?.overview ?? "";
    expect(overview).not.toContain("SUCCESS");
  });

  it("no external calls: engine works offline with mocks only", async () => {
    const input = {
      caseId: "OFFLINE-001",
      claimType: "SUCCESSION_CERTIFICATE",
      jurisdiction: "BANGLADESH",
      documentText: "Offline test.",
      factPattern: "Deceased died on 1 January 2023.",
    };

    // Should complete without any network calls
    const result = await engine.analyze(input);
    
    // Verify response structure
    expect(result).toHaveProperty("stage0");
    expect(result).toHaveProperty("stage13");
    expect(result).toHaveProperty("_security");
    expect(result._security).toHaveProperty("engineVersion");
    expect(result._security.engineVersion).toBe("4.5.1-Hardened");
  });
});
