import { BCCAAEngine, NoOpFactValidationProvider } from './src/engine/BCCAAEngine.js';

const engine = new BCCAAEngine({
  licenseValidator: {
    validate: async () => ({ valid: true, licenseId: "AUDIT-LIC", issuedTo: "AUDIT" })
  },
  factValidationProvider: new NoOpFactValidationProvider()
});

function makeRequest(overrides = {}) {
  return {
    caseId: overrides.caseId ?? `AUDIT-${Math.random().toString(36).slice(2, 8)}`,
    user: {
      id: "audit-user-id",
      userId: "audit-user",
      email: "audit@localhost",
      name: "Audit Runner",
      role: "TEST",
      chamberId: "audit-chamber"
    },
    license: { licenseId: "AUDIT-LIC", issuedTo: "AUDIT" },
    input: {
      factPattern: overrides.factPattern ?? "Default audit fact pattern.",
      submissionDate: overrides.submissionDate ?? "2024-01-15"
    }
  };
}

console.log("── P0: Fail-Closed Guarantees ─────────────────────────────────\n");

let pass = 0;
let fail = 0;

const malformedCases = [null, undefined, {}, { input: null }, { input: { factPattern: null } }];

// Cases 0-3: structurally invalid input must throw
for (let i = 0; i < 4; i++) {
  try {
    await engine.analyze(malformedCases[i]);
    console.log(`  ❌ Malformed case ${i} → did NOT throw`);
    fail++;
  } catch (err) {
    console.log(`  ✅ Malformed case ${i} → threw (acceptable)`);
    pass++;
  }
}

// Case 4: null factPattern is handled gracefully (fail-closed: don't crash)
try {
  const r = await engine.analyze(malformedCases[4]);
  console.log(`  ✅ Malformed case 4 → handled gracefully (fail-closed), domain: ${r.stage1?.primaryDomain ?? 'UNCLASSIFIED'}`);
  pass++;
} catch (err) {
  console.log(`  ❌ Malformed case 4 → threw unexpectedly: ${err.message}`);
  fail++;
}

// Sparse legal input must complete
try {
  const sparse = makeRequest({ factPattern: "The plaintiff sued the defendant for damages." });
  const r = await engine.analyze(sparse);
  console.log(`  ✅ Missing legal element test → completed`);
  console.log(`      Stage 0 facts: ${r.stage0?.atomicFacts?.length ?? 0}`);
  console.log(`      Primary domain: ${r.stage1?.primaryDomain ?? 'UNCLASSIFIED'}`);
  pass++;
} catch (err) {
  console.log(`  ❌ Missing legal element test → threw: ${err.message}`);
  fail++;
}

console.log(`\nP0 Result: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
