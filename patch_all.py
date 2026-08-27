import re

# ─────────────────────────────────────────────────────────────
# 1. ENGINE: remove calculationType from timelineValidation return
#    and remove chronology type mismatches
# ─────────────────────────────────────────────────────────────
with open('src/engine/BCCAAEngine.ts', 'r') as f:
    c = f.read()

# Remove calculationType from timelineValidation in computeLimitation
c = c.replace(
    'timelineValidation: { isValid: true, errors: [], warnings: [], calculationType },',
    'timelineValidation: { isValid: true, errors: [], warnings: [] },'
)

# Remove chronology: ctx.eventTimeline from buildResponse (line ~2617)
c = c.replace(
    '        chronology: ctx.eventTimeline,\n        contradictionGraph: ctx.contradictionGraph,',
    '        contradictionGraph: ctx.contradictionGraph,'
)

# Remove chronology: ctx.eventTimeline from buildF0HaltResponse (line ~2830)
c = c.replace(
    '        chronology: ctx.eventTimeline,\n        contradictionGraph: ctx.contradictionGraph,',
    '        contradictionGraph: ctx.contradictionGraph,'
)

with open('src/engine/BCCAAEngine.ts', 'w') as f:
    f.write(c)

# ─────────────────────────────────────────────────────────────
# 2. TESTS: add non-null assertions for precedents
# ─────────────────────────────────────────────────────────────
with open('src/engine/BCCAAEngine.phase2.test.ts', 'r') as f:
    c = f.read()

c = c.replace('for (const p of r.stage2.precedents) {', 'for (const p of r.stage2!.precedents!) {')
c = c.replace('r.stage2.precedents.length)', '(r.stage2!.precedents!).length)')

with open('src/engine/BCCAAEngine.phase2.test.ts', 'w') as f:
    f.write(c)

# ─────────────────────────────────────────────────────────────
# 3. UI: MissingEvidenceAlert.tsx
# ─────────────────────────────────────────────────────────────
with open('src/components/MissingEvidenceAlert.tsx', 'r') as f:
    c = f.read()

c = c.replace(
    'analysis.stage0.chronology.some(',
    '(analysis.stage0?.chronology ?? []).some('
)

with open('src/components/MissingEvidenceAlert.tsx', 'w') as f:
    f.write(c)

# ─────────────────────────────────────────────────────────────
# 4. UI: StageExplorer.tsx
# ─────────────────────────────────────────────────────────────
with open('src/components/StageExplorer.tsx', 'r') as f:
    c = f.read()

# Line 93
c = c.replace(
    'gateF0.criticalConflictCount > 0',
    '(gateF0?.criticalConflictCount ?? 0) > 0'
)
c = c.replace(
    '>{gateF0.criticalConflictCount}</',
    '>{gateF0?.criticalConflictCount ?? 0}</'
)

# Line 130
c = c.replace(
    '{gateF0.conflicts.length > 0 && (',
    '{(gateF0?.conflicts ?? []).length > 0 && ('
)

# Lines 238, 245
c = c.replace(
    'gateF0 && gateF0.atomicFacts.length > 0 && (',
    'gateF0 && (gateF0?.atomicFacts ?? []).length > 0 && ('
)
c = c.replace(
    '{gateF0.atomicFacts.length} Atomic Propositions',
    '{(gateF0?.atomicFacts ?? []).length} Atomic Propositions'
)

# Line 446
c = c.replace(
    '{analysis.stage2.citationValidationAudit.registrySignature.substring(0, 32)}',
    '{analysis.stage2?.citationValidationAudit?.registrySignature?.substring(0, 32) ?? ""}'
)

# Line 451
c = c.replace(
    '{analysis.stage2.precedents.length > 0 && (',
    '{(analysis.stage2?.precedents ?? []).length > 0 && ('
)

# Lines 622-623
c = c.replace(
    '{analysis.stage5.territorial.rule}</p>',
    '{analysis.stage5?.territorial?.rule ?? ""}</p>'
)
c = c.replace(
    '{analysis.stage5.territorial.governingSection}</span>',
    '{analysis.stage5?.territorial?.governingSection ?? ""}</span>'
)

# Lines 627
c = c.replace(
    '{analysis.stage5.pecuniary.valuation}</p>',
    '{analysis.stage5?.pecuniary?.valuation ?? ""}</p>'
)

# Lines 632-633
c = c.replace(
    '{analysis.stage5.subjectMatter.forum}</p>',
    '{analysis.stage5?.subjectMatter?.forum ?? ""}</p>'
)
c = c.replace(
    '{analysis.stage5.subjectMatter.governingStatute}</span>',
    '{analysis.stage5?.subjectMatter?.governingStatute ?? ""}</span>'
)

# Line 661
c = c.replace(
    '{analysis.stage6.groundsForRejection.length === 0 ? (',
    '{(analysis.stage6?.groundsForRejection ?? []).length === 0 ? ('
)

with open('src/components/StageExplorer.tsx', 'w') as f:
    f.write(c)

# ─────────────────────────────────────────────────────────────
# 5. UI: docxGenerator.ts
# ─────────────────────────────────────────────────────────────
with open('src/utils/docxGenerator.ts', 'r') as f:
    c = f.read()

c = c.replace(
    'analysis.stage5.pecuniary.courtLevel ?? ""',
    'analysis.stage5?.pecuniary?.courtLevel ?? ""'
)
c = c.replace(
    'analysis.stage5.pecuniary.suitsValuationActNotes || "As per Court Fees Act 1870"',
    'analysis.stage5?.pecuniary?.suitsValuationActNotes || "As per Court Fees Act 1870"'
)
c = c.replace(
    'analysis.stage5.pecuniary.courtLevel}',
    'analysis.stage5?.pecuniary?.courtLevel ?? ""}'
)

with open('src/utils/docxGenerator.ts', 'w') as f:
    f.write(c)

# ─────────────────────────────────────────────────────────────
# 6. UI: pdfGeneratorSecure.ts
# ─────────────────────────────────────────────────────────────
with open('src/utils/pdfGeneratorSecure.ts', 'r') as f:
    c = f.read()

c = c.replace(
    'analysis.stage5.pecuniary.courtLevel}</div>',
    'analysis.stage5?.pecuniary?.courtLevel ?? ""}</div>'
)
c = c.replace(
    'analysis.stage5.pecuniary.valuation}</div>',
    'analysis.stage5?.pecuniary?.valuation ?? ""}</div>'
)

# Line 380 has multiple accesses on one line — handle carefully
c = c.replace(
    'analysis.stage5.pecuniary.valuation}</strong> &bull; Competent Court: <strong>${analysis.stage5.pecuniary.courtLevel}</strong><br><em>Notes:</em> ${analysis.stage5.pecuniary.suitsValuationActNotes}',
    'analysis.stage5?.pecuniary?.valuation ?? ""}</strong> &bull; Competent Court: <strong>${analysis.stage5?.pecuniary?.courtLevel ?? ""}</strong><br><em>Notes:</em> ${analysis.stage5?.pecuniary?.suitsValuationActNotes ?? ""}'
)

c = c.replace(
    'analysis.stage5.territorial.rule} (${analysis.stage5.territorial.governingSection})<br><em>Facts:</em> ${analysis.stage5.territorial.jurisdictionalFacts}',
    'analysis.stage5?.territorial?.rule ?? ""} (${analysis.stage5?.territorial?.governingSection ?? ""})<br><em>Facts:</em> ${analysis.stage5?.territorial?.jurisdictionalFacts ?? ""}'
)

c = c.replace(
    'analysis.stage5.subjectMatter.forum} (${analysis.stage5.subjectMatter.governingStatute}) &bull; Excluded: ${analysis.stage5.subjectMatter.isExcluded',
    'analysis.stage5?.subjectMatter?.forum ?? ""} (${analysis.stage5?.subjectMatter?.governingStatute ?? ""}) &bull; Excluded: ${analysis.stage5?.subjectMatter?.isExcluded'
)

c = c.replace(
    'analysis.stage12.appealNodes ?? [])',
    'analysis.stage12?.appealNodes ?? [])'
)

with open('src/utils/pdfGeneratorSecure.ts', 'w') as f:
    f.write(c)

print("✅ All files patched.")
print("Run: npx tsc --noEmit && npx vitest run --pool=forks --maxWorkers=1")
