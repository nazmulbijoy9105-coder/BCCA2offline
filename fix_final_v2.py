#!/usr/bin/env python3
import re
from pathlib import Path

def read(p): return Path(p).read_text(encoding='utf-8')
def write(p, c): Path(p).write_text(c, encoding='utf-8'); print(f"  patched {p}")

# 1. BCCAAEngine.ts -- export CaseAnalysisResponse (handles indentation)
c = read("src/engine/BCCAAEngine.ts")
c = re.sub(r'^\s*(type|interface)\s+(CaseAnalysisResponse\b)', r'export \1 \2', c, flags=re.M)
write("src/engine/BCCAAEngine.ts", c)

# 2. deterministic.test.ts -- clean up CaseAnalysisResponse imports
c = read("src/engine/BCCAAEngine.deterministic.test.ts")
# Remove any standalone import type lines for CaseAnalysisResponse
c = re.sub(r'import\s+type\s*\{\s*CaseAnalysisResponse\s*\}\s*from\s*"./BCCAAEngine";\n', '', c)
# Remove any inline `type CaseAnalysisResponse,` inside import blocks
c = re.sub(r'\s*type\s+CaseAnalysisResponse,\s*\n', '\n', c)
# Ensure exactly one clean import exists at top
if 'CaseAnalysisResponse' not in c.split('import')[0]:
    c = 'import { CaseAnalysisResponse } from "./BCCAAEngine";\n' + c
write("src/engine/BCCAAEngine.deterministic.test.ts", c)

# 3. BCCAAEngine.test.ts -- remove caseId
c = read("src/engine/BCCAAEngine.test.ts")
c = c.replace('caseId: "HALT-EMPTY",', '')
write("src/engine/BCCAAEngine.test.ts", c)

# 4. All test files -- add ! after the nested optional properties
test_files = [
    "src/engine/BCCAAEngine.phase1b.test.ts",
    "src/engine/BCCAAEngine.phase2.test.ts",
    "src/engine/BCCAAEngine.phase3.test.ts",
]

for path in test_files:
    if not Path(path).exists():
        continue
    c = read(path)
    # Add ! after atomicFacts, propositions, provenance, eventTimeline, citationValidationAudit
    # but avoid double-banging
    c = re.sub(r'r\.stage0!\.atomicFacts\b(?!!)', 'r.stage0!.atomicFacts!', c)
    c = re.sub(r'r\.stage0!\.propositions\b(?!!)', 'r.stage0!.propositions!', c)
    c = re.sub(r'r\.stage0!\.provenance\b(?!!)', 'r.stage0!.provenance!', c)
    c = re.sub(r'r\.stage0!\.eventTimeline\b(?!!)', 'r.stage0!.eventTimeline!', c)
    c = re.sub(r'r\.stage2!\.citationValidationAudit\b(?!!)', 'r.stage2!.citationValidationAudit!', c)
    c = re.sub(r'r1\.stage0!\.atomicFacts\b(?!!)', 'r1.stage0!.atomicFacts!', c)
    c = re.sub(r'r2\.stage0!\.atomicFacts\b(?!!)', 'r2.stage0!.atomicFacts!', c)
    c = re.sub(r'results\[(\d+)\]!\.stage0!\.atomicFacts\b(?!!)', r'results[\1]!.stage0!.atomicFacts!', c)
    write(path, c)

print("\nDone. Run:  npx tsc --noEmit")
