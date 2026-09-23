/**
 * P4-04b Phase A scaffold — corpus -> registry promotion (Batch 2+).
 * NOT wired into the engine. Run manually:  npx tsx scripts/generate-limitation-registry.ts
 * Emits: src/engine/rules/GeneratedLimitationEntries.ts (committed only with its Batch).
 *
 * Seed rules (audit N1/G1/G3):
 *  - default effectiveFrom: "1909-01-01" (First Schedule in force 1 Jan 1909)
 *  - 1929-inserted (48A,48B,134A,134B,134C), 64A (1961), 162A (1965):
 *      effectiveFromPendingVerification=true — commencement dates need PLCP-07 review
 *  - 113/114 amendment versions follow the existing DevelopmentLimitationRegistry pattern
 *  - omitted entries -> tombstones { status: "OMITTED", omittedBy }
 *  - accrualTrigger: emitted as triggerRaw (corpus "s" string) — enum mapping is
 *    Phase B (legal review unit = trigger CLASS, not article).
 */
import { LIMITATION_ACT_1908_CORPUS } from "../src/engine/citations/LimitationAct1908Corpus";
import { writeFileSync } from "node:fs";

const PENDING_VERIFICATION = new Set(["48A","48B","134A","134B","134C","64A","162A"]);

type CorpusArticle = { a?: string; d?: string; p?: string; s?: string; omitted?: string };
const entries: CorpusArticle[] = [
  ...LIMITATION_ACT_1908_CORPUS.schedule.division_1_suits,
  ...LIMITATION_ACT_1908_CORPUS.schedule.division_2_appeals,
  ...LIMITATION_ACT_1908_CORPUS.schedule.division_3_applications,
] as CorpusArticle[];

function parsePeriod(p?: string): { value: number; unit: "YEAR" | "MONTH" | "DAY" } | null {
  if (!p) return null;
  let m = /^(\d+)\s+years?$/i.exec(p.trim());  if (m) return { value: +m[1], unit: "YEAR" };
  m = /^(\d+)\s+months?$/i.exec(p.trim());     if (m) return { value: +m[1], unit: "MONTH" };
  m = /^(\d+)\s+days?$/i.exec(p.trim());       if (m) return { value: +m[1], unit: "DAY" };
  return null;
}

const draft = entries.map((e) => ({
  article: e.a ?? null,
  description: e.d ?? null,
  period: parsePeriod(e.p),
  triggerRaw: e.s ?? null,
  status: e.omitted ? "OMITTED" : "ACTIVE_DRAFT",
  omittedBy: e.omitted ?? null,
  effectiveFromSeed: e.omitted ? null
    : PENDING_VERIFICATION.has(e.a ?? "") ? null : "1909-01-01",
  effectiveFromPendingVerification: !e.omitted && PENDING_VERIFICATION.has(e.a ?? ""),
}));

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: scripts/generate-limitation-registry.ts over LimitationAct1908Corpus.
 * STATUS: PROMOTED_DRAFT — registry-level authorityStatus remains DEVELOPMENT_FIXTURE;
 * production gate is NOT relaxed by this file (fail-closed preserved).
 */
export const LIMITATION_PROMOTION_DRAFT = ${JSON.stringify(draft, null, 2)} as const;
`;

writeFileSync("src/engine/rules/GeneratedLimitationEntries.ts", banner);
console.log(`draft entries: ${draft.length}`);
