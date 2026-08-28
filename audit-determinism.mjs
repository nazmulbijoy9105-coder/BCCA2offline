import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from './src/engine/BCCAAEngine.js';

const engine = new BCCAAEngine({
  licenseValidator: {
    validate: async () => ({ valid: true, licenseId: "AUDIT-LIC", issuedTo: "AUDIT" })
  },
  factValidationProvider: new NoOpFactValidationProvider()
});

function makeRequest(overrides = {}) {
  return {
    caseId: overrides.caseId ?? "P1-DETERMINISTIC",
    user: {
      id: "test-id", userId: "test-user", email: "test@localhost",
      name: "Test User", role: "TEST", chamberId: "test-chamber"
    },
    license: { licenseId: "AUDIT-LIC", issuedTo: "AUDIT" },
    input: {
      factPattern: overrides.factPattern ?? "The plaintiff relied on an unregistered bainapatra.",
      submissionDate: overrides.submissionDate ?? "2024-01-15"
    }
  };
}

console.log("── P1: Determinism & Isolation Stress Test ────────────────────\n");

let pass = 0;
let fail = 0;

// 1. Semantic determinism
try {
  const input = makeRequest({
    caseId: "P1-01",
    factPattern: "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021."
  });
  const r1 = await engine.analyze(input);
  const r2 = await engine.analyze(input);
  if (canonicalStringify(r1) === canonicalStringify(r2)) {
    console.log("  ✅ Identical input produces identical output");
    pass++;
  } else {
    console.log("  ❌ Outputs differ for identical input");
    fail++;
  }
} catch (err) {
  console.log(`  ❌ Semantic determinism → threw: ${err.message}`);
  fail++;
}

// 2. Temporal determinism
try {
  const r = await engine.analyze(makeRequest({
    caseId: "P1-02",
    factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.",
    submissionDate: "2024-01-15"
  }));
  if (r.stage3?.isTimeBarred === true && r.stage3?.accrualDate === "2020-08-20") {
    console.log("  ✅ 3-year limitation correctly TIME_BARRED with accrual 2020-08-20");
    pass++;
  } else {
    console.log(`  ❌ Temporal check failed: isTimeBarred=${r.stage3?.isTimeBarred}, accrualDate=${r.stage3?.accrualDate}`);
    fail++;
  }
} catch (err) {
  console.log(`  ❌ Temporal determinism → threw: ${err.message}`);
  fail++;
}

// 3. Fact extraction determinism
try {
  const r = await engine.analyze(makeRequest({ caseId: "P1-03", factPattern: "The plaintiff relied on an unregistered bainapatra." }));
  const objs = (r.stage0?.atomicFacts ?? []).map(f => f.object).filter(Boolean);
  if (objs.includes("UNREGISTERED")) {
    console.log("  ✅ UNREGISTERED found in atomicFacts");
    pass++;
  } else {
    console.log("  ❌ UNREGISTERED not found in atomicFacts");
    fail++;
  }
} catch (err) {
  console.log(`  ❌ Fact extraction → threw: ${err.message}`);
  fail++;
}

console.log(`\nP1 Result: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);