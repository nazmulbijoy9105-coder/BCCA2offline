import { BCCAAEngine, NoOpFactValidationProvider } from './src/engine/BCCAAEngine.js';

const engine = new BCCAAEngine({
  licenseValidator: {
    validate: async () => ({ valid: true, licenseId: "AUDIT-LIC", issuedTo: "AUDIT" })
  },
  factValidationProvider: new NoOpFactValidationProvider()
});

function makeRequest(overrides = {}) {
  return {
    caseId: overrides.caseId ?? "P2-PIPELINE",
    user: {
      id: "test-id", userId: "test-user", email: "test@localhost",
      name: "Test User", role: "TEST", chamberId: "test-chamber"
    },
    license: { licenseId: "AUDIT-LIC", issuedTo: "AUDIT" },
    input: {
      factPattern: overrides.factPattern ?? "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020. The property is Khatian No. 456.",
      submissionDate: overrides.submissionDate ?? "2024-01-15"
    }
  };
}

console.log("── P2: Deep Legal Pipeline Audit ──────────────────────────────\n");

let pass = 0;
let fail = 0;

try {
  const r = await engine.analyze(makeRequest({ caseId: "P2-01" }));

  const requiredStages = ['stage0', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6', 'stage9', 'stage12', 'stage13'];
  const missing = requiredStages.filter(s => r[s] === undefined);

  if (missing.length === 0) {
    console.log("  ✅ All expected stages present");
    pass++;
  } else {
    console.log(`  ❌ Missing stages: ${missing.join(', ')}`);
    fail++;
  }

  if (r.stage0?.atomicFacts?.length > 0) {
    console.log(`  ✅ Stage 0: ${r.stage0.atomicFacts.length} atomic facts`);
    pass++;
  } else {
    console.log("  ❌ Stage 0 has no atomic facts"); fail++;
  }

  if (r.stage1?.primaryDomain) {
    console.log(`  ✅ Stage 1 domain: ${r.stage1.primaryDomain}`); pass++;
  } else {
    console.log("  ❌ Stage 1 missing primaryDomain"); fail++;
  }

  if (r.stage2?.primaryAct) {
    console.log(`  ✅ Stage 2 act: ${r.stage2.primaryAct}`); pass++;
  } else {
    console.log("  ❌ Stage 2 missing primaryAct"); fail++;
  }

  if (r.stage3 && typeof r.stage3.isTimeBarred === 'boolean') {
    console.log(`  ✅ Stage 3: ${r.stage3.isTimeBarred ? 'TIME_BARRED' : 'MAINTAINABLE'}`); pass++;
  } else if (r.stage3) {
    console.log(`  ⚠️  Stage 3 present but limitation flag invalid: ${JSON.stringify(r.stage3).slice(0,120)}`);
    fail++;
  } else {
    console.log("  ❌ Stage 3 missing entirely"); fail++;
  }

} catch (err) {
  console.log(`  ❌ Pipeline audit → threw: ${err.message}`);
  console.error(err);
  fail++;
}

console.log(`\nP2 Result: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
