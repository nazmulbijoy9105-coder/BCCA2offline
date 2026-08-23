#!/usr/bin/env python3
import re
from pathlib import Path

def read(p): return Path(p).read_text(encoding='utf-8')
def write(p, c): Path(p).write_text(c, encoding='utf-8'); print(f"  patched {p}")

c = read("src/engine/BCCAAEngine.ts")
if "export type CaseAnalysisResponse" not in c and "export interface CaseAnalysisResponse" not in c:
    c = re.sub(r"^(type\s+CaseAnalysisResponse\b)", r"export \1", c, flags=re.M)
    c = re.sub(r"^(interface\s+CaseAnalysisResponse\b)", r"export \1", c, flags=re.M)
write("src/engine/BCCAAEngine.ts", c)

c = read("src/types/types.ts")
c = re.sub(r"(\s*_debug\?: any;\n)(\s*_debug\?: any;\n)+", r"\1", c)
write("src/types/types.ts", c)

c = read("src/engine/BCCAAEngine.test.ts")
c = re.sub(r'caseId:\s*"HALT-EMPTY",\s*factPattern,', "factPattern,", c)
write("src/engine/BCCAAEngine.test.ts", c)

test_fixes = {
    "src/engine/BCCAAEngine.phase1b.test.ts": [
        (r"r\.stage2!\.citationValidationAudit\b(?!\.totalCitations)", r"r.stage2!.citationValidationAudit"),
        (r"r\.stage0!\.atomicFacts\b(?!\.length|\.filter|\.map|\.some)", r"r.stage0!.atomicFacts"),
        (r"r\.stage0!\.propositions\b(?!\.map)", r"r.stage0!.propositions"),
        (r"r\.stage0!\.provenance\b(?!\.length|\.forEach)", r"r.stage0!.provenance"),
        (r"r\.stage0!\.eventTimeline\b(?!\.forEach)", r"r.stage0!.eventTimeline"),
    ],
    "src/engine/BCCAAEngine.phase2.test.ts": [
        (r"r\.stage2!\.citationValidationAudit\b(?!\.totalCitations)", r"r.stage2!.citationValidationAudit"),
        (r"r1\.stage0!\.atomicFacts\b(?!\.some)", r"r1.stage0!.atomicFacts"),
        (r"r2\.stage0!\.atomicFacts\b(?!\.some)", r"r2.stage0!.atomicFacts"),
        (r"results\[(\d+)\]!\.stage0!\.atomicFacts\b(?!\.some)", r"results[\1]!.stage0!.atomicFacts"),
    ],
    "src/engine/BCCAAEngine.phase3.test.ts": [
        (r"r\.stage0!\.atomicFacts\b(?!\.length)", r"r.stage0!.atomicFacts"),
        (r"r\.stage2!\.citationValidationAudit\b(?!\.validationStandard|\.registrySignature)", r"r.stage2!.citationValidationAudit"),
    ],
}

for path, replacements in test_fixes.items():
    if not Path(path).exists():
        continue
    c = read(path)
    for old, new in replacements:
        c = re.sub(old, new + "!", c)
    write(path, c)

c = read("src/engine/BCCAAEngine.deterministic.test.ts")
c = re.sub(r'type\s+CaseAnalysisResponse,\s*', '', c)
if "interface CaseAnalysisResponse" not in c and "type CaseAnalysisResponse" not in c:
    c = c.replace('import {', 'import type { CaseAnalysisResponse } from "./BCCAAEngine";\nimport {')
write("src/engine/BCCAAEngine.deterministic.test.ts", c)

print("\nDone. Run:  npx tsc --noEmit")
