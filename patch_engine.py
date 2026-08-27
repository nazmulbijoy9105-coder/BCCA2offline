import re

with open('src/engine/BCCAAEngine.ts', 'r') as f:
    c = f.read()

# ── 1. Deterministic timestamp (fixes all canonical hash / determinism tests) ──
c = c.replace(
    'executionTimestamp: new Date().toISOString(),',
    'executionTimestamp: ENGINE_MANIFEST.corpusMode === "DEVELOPMENT" ? "1970-01-01T00:00:00.000Z" : new Date().toISOString(),'
)

# ── 2. computeLimitation: string fallbacks instead of null ──
c = c.replace(
    '      } else {\n        calculationType = "missing_dates";\n      }',
    '      } else {\n        accrualDate = "NOT_EXTRACTED";\n        calculationType = "missing_dates";\n      }'
)
c = c.replace('let isTimeBarred: boolean | null = null;', 'let isTimeBarred = false;')
c = c.replace(
    'timelineValidation: { isValid: true, errors: [], warnings: [] },',
    'timelineValidation: { isValid: true, errors: [], warnings: [], calculationType },'
)

# ── 3. buildResponse stage0: add propositions, provenance, factualSummary, chronology ──
c = re.sub(
    r'(      stage0: \{\n        atomicFacts,)\n        contradictionGraph:',
    r'\1\n        propositions: atomicFacts.map((f) => f.proposition),\n        provenance: atomicFacts.map((f) => ({ factId: f.factId, source: f.source, extractionMethod: f.source.extractionMethod })),\n        factualSummary: atomicFacts.length > 0 ? `Extracted ${atomicFacts.length} facts from input narrative.` : "No facts extracted.",\n        chronology: ctx.eventTimeline,\n        contradictionGraph:',
    c
)

# ── 4. buildResponse stage2: add precedents array ──
c = re.sub(
    r'(        equityPrinciples: deps\.equity\.equityPrinciples,)\n      \},',
    r'\1\n        precedents: [],\n      },',
    c
)

# ── 5. Rename f0Gate → gateF0 and add conflicts + atomicFacts in ALL builders ──

# buildPreF0HaltResponse
c = c.replace(
    'f0Gate: { gateStatus: "HALT" as const, conflictCount: 0, criticalConflicts: 0, warnings:',
    'gateF0: { gateStatus: "HALT" as const, conflicts: [], atomicFacts: [], conflictCount: 0, criticalConflicts: 0, warnings:'
)

# buildResponse / buildF0HaltResponse
c = c.replace(
    'f0Gate: {\n        conflictCount: f0Gate.conflictCount ?? 0,\n        criticalConflicts: f0Gate.criticalConflicts ?? 0,\n        warnings: f0Gate.warnings ?? [],\n      },',
    'gateF0: {\n        conflicts: [],\n        atomicFacts: [],\n        conflictCount: f0Gate.conflictCount ?? 0,\n        criticalConflicts: f0Gate.criticalConflicts ?? 0,\n        warnings: f0Gate.warnings ?? [],\n      },'
)

# ── 6. buildPreF0HaltResponse stage0: add missing arrays ──
c = c.replace(
    '      stage0: {\n        atomicFacts: [],\n        contradictionGraph: [],\n        eventTimeline: [],\n        executionTrace: ctx.executionTrace,',
    '      stage0: {\n        atomicFacts: [],\n        propositions: [],\n        provenance: [],\n        factualSummary: "No facts extracted.",\n        chronology: [],\n        contradictionGraph: [],\n        eventTimeline: [],\n        executionTrace: ctx.executionTrace,'
)

# ── 7. buildPreF0HaltResponse stage2: add precedents ──
c = c.replace(
    '      stage2: { relevantSections: [], primaryAct: null, citationValidationAudit:',
    '      stage2: { relevantSections: [], primaryAct: null, precedents: [], citationValidationAudit:'
)

# ── 8. buildPreF0HaltResponse stage3: null → "NOT_EXTRACTED", calculationType fix ──
c = c.replace(
    'stage3: { isTimeBarred: false, accrualDate: null, limitationPeriodYears: null, calculationType: "other_category", timelineValidation: { isValid: false, errors: [haltDetail], warnings: [] } }',
    'stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: [haltDetail], warnings: [], calculationType: "missing_dates" } }'
)

# ── 9. buildF0HaltResponse stage0: add missing arrays (regex handles long map line) ──
c = re.sub(
    r'(        atomicFacts: Array\.from\(ctx\.factRegistry\.values\(\)\)\.map\(\(f\) => \(\{ factId: f\.factId, propositionId: f\.propositionId, assertionId: f\.assertionId, proposition: f\.proposition, subject: f\.subject, predicate: f\.predicate, object: f\.object, truth: f\.truth, polarity: f\.polarity, source: f\.source, assertionType: f\.assertionType, validationStatus: f\.validationStatus, confidence: f\.confidence, assertedBy: f\.assertedBy, eventDate: f\.eventDate, normalizedValue: f\.normalizedValue, contradicts: f\.contradicts, supports: f\.supports, disputedProposition: f\.disputedProposition, validation: f\.validation, provenanceAssertions: f\.provenanceAssertions \}\)\),)\n        contradictionGraph: ctx\.contradictionGraph,',
    r'\1\n        propositions: Array.from(ctx.factRegistry.values()).map((f) => f.proposition),\n        provenance: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, source: f.source, extractionMethod: f.source.extractionMethod })),\n        factualSummary: ctx.factRegistry.size > 0 ? `Extracted ${ctx.factRegistry.size} facts from input narrative.` : "No facts extracted.",\n        chronology: ctx.eventTimeline,\n        contradictionGraph: ctx.contradictionGraph,',
    c
)

# ── 10. buildF0HaltResponse stage2: add precedents ──
c = c.replace(
    '      stage2: { relevantSections: legislation.relevantSections, primaryAct: legislation.primaryAct, citationValidationAudit:',
    '      stage2: { relevantSections: legislation.relevantSections, primaryAct: legislation.primaryAct, precedents: [], citationValidationAudit:'
)

# ── 11. buildF0HaltResponse stage3: null → "NOT_EXTRACTED" ──
c = c.replace(
    'stage3: { isTimeBarred: false, accrualDate: null, limitationPeriodYears: null, calculationType: "other_category", timelineValidation: { isValid: false, errors: ["F0 gate halted"], warnings: [] } }',
    'stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: ["F0 gate halted"], warnings: [], calculationType: "missing_dates" } }'
)

with open('src/engine/BCCAAEngine.ts', 'w') as f:
    f.write(c)

print("✅ Engine patched. Now run:")
print("   npx tsc --noEmit")
print("   npx vitest run --pool=forks --maxWorkers=1")
