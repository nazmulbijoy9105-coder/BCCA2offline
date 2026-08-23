#!/usr/bin/env python3
import re
from pathlib import Path

def read(p): return Path(p).read_text(encoding='utf-8')
def write(p, c): Path(p).write_text(c, encoding='utf-8'); print(f"  patched {p}")

# =============================================================================
# 1. BCCAAEngine.ts -- add claimType to EngineInput (handle both interface and type)
# =============================================================================
c = read("src/engine/BCCAAEngine.ts")
# Find EngineInput and add claimType if missing
if "claimType" not in c.split("interface EngineInput")[1].split("}")[0] if "interface EngineInput" in c else True:
    c = c.replace("interface EngineInput {", "interface EngineInput {\n  claimType?: string;")
if "claimType" not in c.split("type EngineInput")[1].split("}")[0] if "type EngineInput" in c else True:
    c = c.replace("type EngineInput = {", "type EngineInput = {\n  claimType?: string;")
write("src/engine/BCCAAEngine.ts", c)

# =============================================================================
# 2. BCCAAEngine.deterministic.test.ts -- cast response to any for deep property access
# =============================================================================
c = read("src/engine/BCCAAEngine.deterministic.test.ts")

# Line 40: destructuring response with outcome
c = c.replace(
    'const { gateF0, stage0, stage1, stage2, stage3, stage4, stage5, outcome } = response;',
    'const { gateF0, stage0, stage1, stage2, stage3, stage4, stage5, outcome } = response as any;'
)

# Line 50: dispossessionProven
c = c.replace(
    'dispossessionProven: stage0?.dispossessionProven,',
    'dispossessionProven: (stage0 as any)?.dispossessionProven,'
)

# Line 92: timelineProgress
c = c.replace(
    'timelineProgress: stage5?.timelineProgress,',
    'timelineProgress: (stage5 as any)?.timelineProgress,'
)

# Lines 252-257: citationValidationAudit
c = c.replace(
    'expect(r.stage2.citationValidationAudit.totalCitations).toBeGreaterThanOrEqual(0);',
    'expect(r.stage2!.citationValidationAudit!.totalCitations).toBeGreaterThanOrEqual(0);'
)
c = c.replace(
    'expect(r.stage2.citationValidationAudit.validationStandard).toBe(',
    'expect(r.stage2!.citationValidationAudit!.validationStandard).toBe('
)
c = c.replace(
    'r.stage2.citationValidationAudit.auditStatus',
    'r.stage2!.citationValidationAudit!.auditStatus'
)

# Line 415: timelineProgress
c = c.replace(
    'expect((r.stage5.timelineProgress ?? []).length).toBeGreaterThanOrEqual(0);',
    'expect(((r.stage5 as any).timelineProgress ?? []).length).toBeGreaterThanOrEqual(0);'
)

write("src/engine/BCCAAEngine.deterministic.test.ts", c)

print("\nDone. Run:  npx tsc --noEmit")
