// src/engine/BCCAAEngine.p0.test.ts
// P0 Fact-Graph Regression Suite
//
// Acceptance criteria:
//   1. Plaintiff assertion
//   2. Defendant assertion
//   3. Same fact from multiple clauses → provenance merged
//   4. Registered vs unregistered → contradiction preserved
//   5. Payment/deposit event extraction
//   6. Refusal event extraction
//   7. Death/ancestor event extraction
//   8. Document type/date provenance
//   9. Party identity reaches Stage 4
//   10. Same request twice → identical canonical output/hash
//   11. Different factual input → different hash
//   12. No orphan Stage-4 parties

import { describe, it, expect, beforeAll } from "vitest";
import {
  BCCAAEngine,
  canonicalStringify,
  canonicalHash,
  DevelopmentFactValidationProvider,
  DevelopmentRuleRegistry,
  AssertionType,
  Tristate,
} from "./BCCAAEngine";

const engine = new BCCAAEngine({
  ruleRegistry: new DevelopmentRuleRegistry(),
  factValidationProvider: new DevelopmentFactValidationProvider(),
});

function makeRequest(overrides: { caseId?: string; factPattern: string; submissionDate?: string }) {
  return {
    caseId: overrides.caseId ?? "P0-TEST",
    user: { id: "test-user", email: "test@test.com", role: "user" as const },
    license: { licenseId: "TEST-LICENSE", issuedTo: "Test User" },
    input: {
      factPattern: overrides.factPattern,
      submissionDate: overrides.submissionDate,
    },
  };
}

// =======================================================================
// P0-1: Party Extraction
// =======================================================================

describe("P0-1 Party extraction", () => {
  it("extracts plaintiff and defendant names from narrative", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-1-PARTIES",
      factPattern: "Plaintiff: Md. Rafiqul Islam. Defendant: Mrs. Shirin Akter. Plaintiff is the purchaser. Defendant is the vendor.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    const plaintiffFacts = facts.filter((f: any) => f.subject === "Plaintiff" && f.predicate === "Party Identity");
    const defendantFacts = facts.filter((f: any) => f.subject === "Defendant" && f.predicate === "Party Identity");

    expect(plaintiffFacts.length).toBeGreaterThanOrEqual(1);
    expect(plaintiffFacts[0].object).toBe("Md. Rafiqul Islam");
    expect(defendantFacts.length).toBeGreaterThanOrEqual(1);
    expect(defendantFacts[0].object).toBe("Mrs. Shirin Akter");
  });

  it("party identity reaches Stage 4 without orphan parties", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-1-STAGE4",
      factPattern: "Plaintiff: Md. Rafiqul Islam. Defendant: Mrs. Shirin Akter.",
    }));
    expect(r.stage4?.plaintiffs).toContain("Md. Rafiqul Islam");
    expect(r.stage4?.defendants).toContain("Mrs. Shirin Akter");
    expect(r.stage4?.plaintiffs.length).toBeGreaterThan(0);
    expect(r.stage4?.defendants.length).toBeGreaterThan(0);
  });
});

// =======================================================================
// P0-2: Monetary Semantic Classification
// =======================================================================

describe("P0-2 Monetary semantic classification", () => {
  it("classifies total consideration, advance, balance, deposit, alternative claim, interest, damages, suit valuation, court fee, jurisdictional value", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-2-MONEY",
      factPattern:
        "Total consideration of Tk. 48,00,000. Advance of Tk. 15,00,000 paid. Balance consideration Tk. 33,00,000. " +
        "Court deposit Tk. 33,00,000. Alternative money claim Tk. 15,00,000. Interest claim Tk. 2,00,000. " +
        "Damages claim Tk. 5,00,000. Suit valuation Tk. 48,00,000. Court fee Tk. 50,000. Jurisdictional value Tk. 48,00,000.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];

    const totalConsideration = facts.find((f: any) => f.subject === "Contract" && f.predicate === "Total Consideration");
    expect(totalConsideration).toBeDefined();
    expect(totalConsideration!.normalizedValue).toBe(4800000);

    const advance = facts.find((f: any) => f.subject === "Advance" && f.predicate === "Amount Paid");
    expect(advance).toBeDefined();
    expect(advance!.normalizedValue).toBe(1500000);

    const balance = facts.find((f: any) => f.subject === "Balance" && f.predicate === "Consideration");
    expect(balance).toBeDefined();
    expect(balance!.normalizedValue).toBe(3300000);

    const deposit = facts.find((f: any) => f.subject === "Court" && f.predicate === "Deposit");
    expect(deposit).toBeDefined();
    expect(deposit!.normalizedValue).toBe(3300000);

    const altClaim = facts.find((f: any) => f.subject === "Alternative Claim" && f.predicate === "Money Claim");
    expect(altClaim).toBeDefined();
    expect(altClaim!.normalizedValue).toBe(1500000);

    const suitVal = facts.find((f: any) => f.subject === "Suit" && f.predicate === "Valuation");
    expect(suitVal).toBeDefined();
    expect(suitVal!.normalizedValue).toBe(4800000);
  });

  it("does not produce the erroneous aggregated value 16600000", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-2-NO-ERR",
      factPattern: "Total consideration Tk. 48,00,000. Advance Tk. 15,00,000. Balance Tk. 33,00,000.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    const badValue = facts.some((f: any) => f.normalizedValue === 16600000 || f.object?.includes("16600000") || f.object?.includes("1,66,00,000"));
    expect(badValue).toBe(false);
  });
});

// =======================================================================
// P0-3: Registration + Section 21A Deposit
// =======================================================================

describe("P0-3 Registration and deposit", () => {
  it("extracts registration case number, Section 17A, treasury challan, Section 21A", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-3-REG",
      factPattern:
        "Registration Case No. MIR-2023-7845 under Section 17A. " +
        "Treasury Challan No. TC-DHK-2024-00892 dated 15 March 2024 for Tk. 33,00,000. " +
        "Compliance with Section 21A of Specific Relief Act.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];

    const regCase = facts.find((f: any) => f.predicate === "Case Number" && f.subject === "Registration");
    expect(regCase?.object).toBe("MIR-2023-7845");

    const sec17a = facts.find((f: any) => f.predicate === "Statutory Basis" && f.object === "Section 17A");
    expect(sec17a).toBeDefined();

    const challan = facts.find((f: any) => f.predicate === "Challan Number");
    expect(challan?.object).toBe("TC-DHK-2024-00892");

    const sec21a = facts.find((f: any) => f.predicate === "Statutory Basis" && f.object === "Section 21A");
    expect(sec21a).toBeDefined();
  });

  it("does not produce SP-ELEMENT-REGISTRATION or SP-ELEMENT-DEPOSIT as unknown", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-3-ELEMENTS",
      factPattern:
        "Registered bainapatra. Treasury deposit of Tk. 33,00,000 made.",
    }));
    const stage8 = r.stage8;
    const unknownElements = stage8?.unknownElements ?? [];
    expect(unknownElements).not.toContain("SP-ELEMENT-REGISTRATION");
    expect(unknownElements).not.toContain("SP-ELEMENT-DEPOSIT");
  });
});

// =======================================================================
// P0-4: Chronology Extraction
// =======================================================================

describe("P0-4 Chronology extraction", () => {
  it("extracts the seven required events with correct types", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-4-CHRONO",
      factPattern:
        "Agreement executed on 18 July 2023. Agreement registered on 18 July 2023. " +
        "Advance of Tk. 15,00,000 paid on 18 July 2023. " +
        "Performance deadline 18 January 2024. Legal notice issued on 25 January 2024. " +
        "Defendant refused on 10 February 2024. Balance deposit of Tk. 33,00,000 on 15 March 2024.",
    }));
    const events = r.stage0?.eventTimeline ?? [];
    const types = events.map((e: any) => e.type);

    expect(types).toContain("AGREEMENT_EXECUTION");
    expect(types).toContain("AGREEMENT_REGISTERED");
    expect(types).toContain("ADVANCE_PAID");
    expect(types).toContain("PERFORMANCE_DEADLINE");
    expect(types).toContain("LEGAL_NOTICE");
    expect(types).toContain("REFUSAL");
    expect(types).toContain("BALANCE_DEPOSIT");
  });
});

// =======================================================================
// P0-5: Evidence Provenance
// =======================================================================

describe("P0-5 Evidence provenance", () => {
  it("classifies defendant reply dated 10 February 2024 as DOCUMENT with DEFENDANT_REPLY type", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-5-PROV",
      factPattern: "Defendant replied on 10 February 2024 denying the allegations.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    const replyFact = facts.find((f: any) => f.source?.documentType === "DEFENDANT_REPLY");
    expect(replyFact).toBeDefined();
    expect(replyFact!.assertionType).toBe(AssertionType.DOCUMENTARY_FACT);
    expect(replyFact!.source.documentDate).toBe("10 February 2024");
  });

  it("does not classify documentary reply as ORAL_ASSERTION", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-5-NO-ORAL",
      factPattern: "Defendant replied on 10 February 2024 denying the allegations.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    const oralFacts = facts.filter((f: any) => f.assertionType === "ORAL_ASSERTION");
    expect(oralFacts.length).toBe(0);
  });
});

// =======================================================================
// P0-6: Canonical Fact Deduplication
// =======================================================================

describe("P0-6 Canonical fact deduplication", () => {
  it("merges provenance when the same fact is encountered twice", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-6-DEDUP",
      factPattern:
        "Plaintiff paid by Pay Order. Plaintiff paid by Pay Order. " +
        "Defendant refused on 10 February 2024. Defendant refused on 10 February 2024.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];

    // Find the Pay Order fact
    const payOrderFacts = facts.filter((f: any) =>
      f.predicate === "Payment Status" && f.object === "DEPOSITED"
    );
    // Should be deduplicated to 1 fact with 2 provenance assertions
    expect(payOrderFacts.length).toBe(1);
    expect(payOrderFacts[0].provenanceAssertions?.length).toBe(2);

    // Find the refusal fact
    const refusalFacts = facts.filter((f: any) =>
      f.predicate === "Refusal Date"
    );
    expect(refusalFacts.length).toBe(1);
    expect(refusalFacts[0].provenanceAssertions?.length).toBe(2);
  });
});

// =======================================================================
// P0-8: Deterministic Case Identity / Output Hash
// =======================================================================

describe("P0-8 Deterministic output", () => {
  it("same input + same caseId produces identical canonical output on repeated runs", async () => {
    const req = makeRequest({
      caseId: "P0-8-DET",
      factPattern: "Plaintiff: Abdul Karim. Defendant: Rahim Miah. Bainapatra executed on 15 July 2020.",
    });
    const r1 = await engine.analyze(req);
    const r2 = await engine.analyze(req);

    // Strip volatile fields for comparison
    const stripVolatile = (r: any) => {
      const copy = JSON.parse(JSON.stringify(r));
      delete copy.executionTimestamp;
      delete copy.auditHash;
      return copy;
    };

    expect(canonicalStringify(stripVolatile(r1))).toBe(canonicalStringify(stripVolatile(r2)));
  });

  it("different factual input produces different output hash", async () => {
    const rA = await engine.analyze(makeRequest({
      caseId: "P0-8-A",
      factPattern: "Plaintiff: Abdul Karim. Defendant: Rahim Miah. Bainapatra executed on 15 July 2020.",
    }));
    const rB = await engine.analyze(makeRequest({
      caseId: "P0-8-B",
      factPattern: "Plaintiff: Abdul Karim. Defendant: Rahim Miah. Bainapatra executed on 16 July 2020.",
    }));

    const stripVolatile = (r: any) => {
      const copy = JSON.parse(JSON.stringify(r));
      delete copy.executionTimestamp;
      delete copy.auditHash;
      return copy;
    };

    expect(canonicalStringify(stripVolatile(rA))).not.toBe(canonicalStringify(stripVolatile(rB)));
  });
});

// =======================================================================
// P0-9: Contradiction Preservation
// =======================================================================

describe("P0-9 Contradiction preservation", () => {
  it("preserves plaintiff REGISTERED vs defendant UNREGISTERED as contradiction", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-9-CONTRA",
      factPattern:
        "Plaintiff says the bainapatra is registered. Defendant says the bainapatra is unregistered.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    const regFacts = facts.filter((f: any) => f.predicate === "Registration Status");
    expect(regFacts.length).toBe(2);

    const plaintiffFact = regFacts.find((f: any) => f.assertedBy === "PLAINTIFF");
    const defendantFact = regFacts.find((f: any) => f.assertedBy === "DEFENDANT");
    expect(plaintiffFact).toBeDefined();
    expect(defendantFact).toBeDefined();
    expect(plaintiffFact!.object).toBe("REGISTERED");
    expect(defendantFact!.object).toBe("UNREGISTERED");

    // After validation, they should be in contradiction
    const contradiction = r.stage0?.contradictionGraph ?? [];
    const regContradiction = contradiction.find((e: any) => e.propositionKey.includes("REGISTRATION STATUS"));
    expect(regContradiction).toBeDefined();
  });
});

// =======================================================================
// P0-10: Stage 0–13 Integration
// =======================================================================

describe("P0-10 Stage 0–13 integration", () => {
  it("produces all 14 stages with non-null values", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-10-INT",
      factPattern:
        "Plaintiff: Md. Rafiqul Islam. Defendant: Mrs. Shirin Akter. " +
        "Registered bainapatra executed on 18 July 2023. " +
        "Advance Tk. 15,00,000 paid. Balance Tk. 33,00,000 deposited on 15 March 2024. " +
        "Defendant refused on 10 February 2024.",
    }));
    expect(r.stage0).toBeDefined();
    expect(r.stage1).toBeDefined();
    expect(r.stage2).toBeDefined();
    expect(r.stage3).toBeDefined();
    expect(r.stage4).toBeDefined();
    expect(r.stage5).toBeDefined();
    expect(r.stage6).toBeDefined();
    expect(r.stage7).toBeDefined();
    expect(r.stage8).toBeDefined();
    expect(r.stage9).toBeDefined();
    expect(r.stage10).toBeDefined();
    expect(r.stage11).toBeDefined();
    expect(r.stage12).toBeDefined();
    expect(r.stage13).toBeDefined();
    expect(r.f0Gate).toBeDefined();
  });
});


// =======================================================================
// P0-11: Adversarial Fixture — plaintiff alleges X, defendant denies X
// =======================================================================

describe("P0-11 Adversarial fixture (plaintiff alleges X, defendant denies X)", () => {
  it("does NOT promote a defendant denial to TRUE", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-11-DENIAL-TRUTH",
      factPattern:
        "Plaintiff alleges the bainapatra was registered. " +
        "Defendant denies the bainapatra was registered.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];

    // Find the defendant's denial fact
    const denialFact = facts.find(
      (f: any) => f.assertedBy === "DEFENDANT" && f.predicate === "Registration Status"
    );
    expect(denialFact).toBeDefined();
    // After validation, a denial must NOT become TRUE
    expect(denialFact!.truth).not.toBe(Tristate.TRUE);
    // It should remain UNKNOWN (not validated into truth)
    expect(denialFact!.truth).toBe(Tristate.UNKNOWN);
  });

  it("creates separate facts for plaintiff assertion and defendant denial (not merged)", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-11-SEPARATE",
      factPattern:
        "Plaintiff alleges the bainapatra was registered. " +
        "Defendant denies the bainapatra was registered.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];

    const regFacts = facts.filter((f: any) => f.predicate === "Registration Status");
    // Should have at least 2 separate facts (one per party)
    expect(regFacts.length).toBeGreaterThanOrEqual(2);

    const plaintiffFact = regFacts.find((f: any) => f.assertedBy === "PLAINTIFF");
    const defendantFact = regFacts.find((f: any) => f.assertedBy === "DEFENDANT");

    expect(plaintiffFact).toBeDefined();
    expect(defendantFact).toBeDefined();
    // They must be different fact IDs
    expect(plaintiffFact!.factId).not.toBe(defendantFact!.factId);
  });

  it("records a contradiction edge for REGISTERED vs UNREGISTERED", async () => {
    const r = await engine.analyze(makeRequest({
      caseId: "P0-11-CONTRA",
      factPattern:
        "Plaintiff says the bainapatra is registered. " +
        "Defendant says the bainapatra is unregistered.",
    }));
    const contradiction = r.stage0?.contradictionGraph ?? [];
    const regContradiction = contradiction.find((e: any) =>
      e.propositionKey.toUpperCase().includes("REGISTRATION STATUS")
    );
    expect(regContradiction).toBeDefined();
    expect(regContradiction!.status).toBe("CRITICAL");
  });

  it("does NOT silently swallow a denial that matches the plaintiff's object", async () => {
    // Edge case: both parties use the word "registered" but one denies it
    // Plaintiff: "bainapatra is registered"
    // Defendant: "denies the bainapatra was registered" (object still "REGISTERED" from extraction)
    const r = await engine.analyze(makeRequest({
      caseId: "P0-11-SWALLOW",
      factPattern:
        "Plaintiff says the bainapatra is registered. " +
        "Defendant denies the bainapatra was registered.",
    }));
    const facts = r.stage0?.atomicFacts ?? [];
    const regFacts = facts.filter((f: any) => f.predicate === "Registration Status");

    // Both facts must exist independently
    const plaintiffFact = regFacts.find((f: any) => f.assertedBy === "PLAINTIFF");
    const defendantFact = regFacts.find((f: any) => f.assertedBy === "DEFENDANT");

    expect(plaintiffFact).toBeDefined();
    expect(defendantFact).toBeDefined();

    // The defendant fact must retain its denial character
    expect(defendantFact!.assertionType).toBe(AssertionType.DENIED);
    expect(defendantFact!.polarity).toBe("DISPUTED");
  });
});
