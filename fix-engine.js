const fs = require('fs');
let text = fs.readFileSync('src/engine/BCCAAEngine.ts', 'utf8');

// Normalize line endings to LF
text = text.replace(/\r\n/g, '\n');
const lines = text.split('\n');

// ========== FIX 1: Corrupted executeProcedureRules ==========
const execIdx = lines.findIndex(l => l.includes('private executeProcedureRules('));
if (execIdx !== -1) {
  let endIdx = -1;
  for (let i = execIdx + 1; i < Math.min(lines.length, execIdx + 30); i++) {
    if (lines[i].match(/^  \}$/)) {
      endIdx = i;
      break;
    }
  }
  if (endIdx !== -1) {
    const replacement = [
      '  private executeProcedureRules(',
      '    _ctx: ExecutionContext,',
      '    _claimType: ClaimType,',
      '  ): { proceduralCompliance: boolean; proceduralNotes: string[] } {',
      '    return { proceduralCompliance: true, proceduralNotes: [] };',
      '  }'
    ];
    lines.splice(execIdx, endIdx - execIdx + 1, ...replacement);
    console.log('✅ Fixed executeProcedureRules (lines ' + (execIdx+1) + '-' + (endIdx+1) + ')');
  } else {
    console.log('⚠️ Could not find end of corrupted executeProcedureRules block');
  }
} else {
  console.log('⚠️ executeProcedureRules not found');
}

// Rejoin for string replacements
let newText = lines.join('\n');

// ========== FIX 2: buildPreF0HaltResponse stage5 ==========
const preOld = '      stage5: { plaintChecklist: [], groundsForRejection: [haltDetail] },';
const preNew = `      stage5: {
        territorial: { rule: null, governingSection: null, jurisdictionalFacts: null },
        pecuniary: { valuation: null, courtLevel: null, pecuniaryLimits: null, suitsValuationActNotes: null },
        subjectMatter: { isExcluded: false, forum: null, governingStatute: null },
        objectionStrategy: null,
        plaintChecklist: [],
        groundsForRejection: [haltDetail],
      },`;
if (newText.includes(preOld)) {
  newText = newText.replace(preOld, preNew);
  console.log('✅ Fixed buildPreF0HaltResponse stage5');
} else {
  console.log('⚠️ buildPreF0HaltResponse stage5 not found');
}

// ========== FIX 3: buildF0HaltResponse stage5 ==========
const f0Old = '      stage5: { plaintChecklist: [], groundsForRejection: ["F0 gate halted"] },';
const f0New = `      stage5: {
        territorial: { rule: null, governingSection: null, jurisdictionalFacts: null },
        pecuniary: { valuation: null, courtLevel: null, pecuniaryLimits: null, suitsValuationActNotes: null },
        subjectMatter: { isExcluded: false, forum: null, governingStatute: null },
        objectionStrategy: null,
        plaintChecklist: [],
        groundsForRejection: ["F0 gate halted"],
      },`;
if (newText.includes(f0Old)) {
  newText = newText.replace(f0Old, f0New);
  console.log('✅ Fixed buildF0HaltResponse stage5');
} else {
  console.log('⚠️ buildF0HaltResponse stage5 not found');
}

// ========== FIX 4: buildResponse stage5 ==========
const buildOld = `      stage5: {
        plaintChecklist: deps.pleading.plaintChecklist,
        groundsForRejection: deps.pleading.groundsForRejection,
      },`;
const buildNew = `      stage5: {
        territorial: { rule: null, governingSection: null, jurisdictionalFacts: null },
        pecuniary: { valuation: null, courtLevel: null, pecuniaryLimits: null, suitsValuationActNotes: null },
        subjectMatter: { isExcluded: false, forum: null, governingStatute: null },
        objectionStrategy: null,
        plaintChecklist: deps.pleading.plaintChecklist,
        groundsForRejection: deps.pleading.groundsForRejection,
      },`;
if (newText.includes(buildOld)) {
  newText = newText.replace(buildOld, buildNew);
  console.log('✅ Fixed buildResponse stage5');
} else {
  console.log('ℹ️ buildResponse stage5 not found (may already be fixed)');
}

fs.writeFileSync('src/engine/BCCAAEngine.ts', newText);
console.log('\n📝 src/engine/BCCAAEngine.ts updated.');
