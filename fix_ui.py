import re

# MissingEvidenceAlert.tsx
with open('src/components/MissingEvidenceAlert.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('analysis.stage0.chronology.some(', '(analysis.stage0?.chronology ?? []).some(')
with open('src/components/MissingEvidenceAlert.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# StageExplorer.tsx
with open('src/components/StageExplorer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('gateF0.criticalConflictCount > 0', '(gateF0?.criticalConflictCount ?? 0) > 0')
c = c.replace('>{gateF0.criticalConflictCount}<', '>{gateF0?.criticalConflictCount ?? 0}<')
c = c.replace('gateF0.conflicts.length > 0', '(gateF0?.conflicts ?? []).length > 0')
c = c.replace('gateF0 && gateF0.atomicFacts.length > 0', 'gateF0 && (gateF0?.atomicFacts ?? []).length > 0')
c = c.replace('gateF0.atomicFacts.length}', '(gateF0?.atomicFacts ?? []).length}')
c = c.replace('analysis.stage2.citationValidationAudit.registrySignature.substring(0, 32)', 'analysis.stage2?.citationValidationAudit?.registrySignature?.substring(0, 32) ?? ""')
c = c.replace('analysis.stage2.precedents.length > 0', '(analysis.stage2?.precedents ?? []).length > 0')
c = c.replace('analysis.stage5.territorial.rule}</p>', 'analysis.stage5?.territorial?.rule ?? ""}</p>')
c = c.replace('analysis.stage5.territorial.governingSection}</span>', 'analysis.stage5?.territorial?.governingSection ?? ""}</span>')
c = c.replace('analysis.stage5.pecuniary.valuation}</p>', 'analysis.stage5?.pecuniary?.valuation ?? ""}</p>')
c = c.replace('analysis.stage5.subjectMatter.forum}</p>', 'analysis.stage5?.subjectMatter?.forum ?? ""}</p>')
c = c.replace('analysis.stage5.subjectMatter.governingStatute}</span>', 'analysis.stage5?.subjectMatter?.governingStatute ?? ""}</span>')
c = c.replace('analysis.stage6.groundsForRejection.length === 0', '(analysis.stage6?.groundsForRejection ?? []).length === 0')

with open('src/components/StageExplorer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# docxGenerator.ts
with open('src/utils/docxGenerator.ts', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('analysis.stage5.pecuniary.courtLevel ?? ""', 'analysis.stage5?.pecuniary?.courtLevel ?? ""')
c = c.replace('analysis.stage5.pecuniary.suitsValuationActNotes || "As per Court Fees Act 1870"', 'analysis.stage5?.pecuniary?.suitsValuationActNotes || "As per Court Fees Act 1870"')
c = c.replace('analysis.stage5.pecuniary.courtLevel}', 'analysis.stage5?.pecuniary?.courtLevel ?? ""}')
with open('src/utils/docxGenerator.ts', 'w', encoding='utf-8') as f:
    f.write(c)

# pdfGeneratorSecure.ts
with open('src/utils/pdfGeneratorSecure.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('analysis.stage5.pecuniary.courtLevel}</div>', 'analysis.stage5?.pecuniary?.courtLevel ?? ""}</div>')
c = c.replace('analysis.stage5.pecuniary.valuation}</div>', 'analysis.stage5?.pecuniary?.valuation ?? ""}</div>')
c = c.replace('analysis.stage5.pecuniary.valuation}</strong> &bull; Competent Court: <strong>${analysis.stage5.pecuniary.courtLevel}</strong><br><em>Notes:</em> ${analysis.stage5.pecuniary.suitsValuationActNotes}', 'analysis.stage5?.pecuniary?.valuation ?? ""}</strong> &bull; Competent Court: <strong>${analysis.stage5?.pecuniary?.courtLevel ?? ""}</strong><br><em>Notes:</em> ${analysis.stage5?.pecuniary?.suitsValuationActNotes ?? ""}')
c = c.replace('analysis.stage5.territorial.rule} (${analysis.stage5.territorial.governingSection})<br><em>Facts:</em> ${analysis.stage5.territorial.jurisdictionalFacts}', 'analysis.stage5?.territorial?.rule ?? ""} (${analysis.stage5?.territorial?.governingSection ?? ""})<br><em>Facts:</em> ${analysis.stage5?.territorial?.jurisdictionalFacts ?? ""}')
c = c.replace('analysis.stage5.subjectMatter.forum} (${analysis.stage5.subjectMatter.governingStatute}) &bull; Excluded: ${analysis.stage5.subjectMatter.isExcluded', 'analysis.stage5?.subjectMatter?.forum ?? ""} (${analysis.stage5?.subjectMatter?.governingStatute ?? ""}) &bull; Excluded: ${analysis.stage5?.subjectMatter?.isExcluded')
c = c.replace('analysis.stage12.appealNodes ?? [])', 'analysis.stage12?.appealNodes ?? [])')

with open('src/utils/pdfGeneratorSecure.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print("UI fixed")
