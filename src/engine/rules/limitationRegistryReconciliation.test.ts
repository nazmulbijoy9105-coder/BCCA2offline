import { describe, it, expect } from "vitest";
import { DevelopmentLimitationRegistry } from "./DevelopmentLimitationRegistry";
import { LIMITATION_ACT_1908_CORPUS } from "../citations/LimitationAct1908Corpus";
import { getActEffectiveDate } from "../citations/EffectiveDateResolver";
import { isISODateString, compareISO } from "../../utils/isoDate";

/**
 * P4-04 Batch 1 — registry<->corpus reconciliation guard.
 *  R1 Corpus census: 194 First-Schedule entries, unique IDs (86 via 86(a)/86(b)).
 *  R2 Registry structural integrity: ISO bounds, positive periods, ordered windows.
 *  R3 Schedule commencement: 1909-01-01 or a documented amendment date (2005-07-01).
 *  R4 Registry subset of corpus.
 *  R5 Period agreement with corpus, except documented PLCP-07 review items.
 *  R6 EffectiveDateResolver baseline agrees with Schedule commencement.
 */

// PENDING LEGAL REVIEW (PLCP-07) — audit note N6: registry 114/115/116 model
// 12-year possession rules while the corpus assigns different subjects to
// these numbers (114 rescission 1y, 115 insane-conveyance 3y, 116 registered-
// contract breach 6y). ARTICLE_149 is SUSPENDED (retained for audit history).
const KNOWN_PERIOD_DISCREPANCIES = new Set([
  "ARTICLE_114", "ARTICLE_115", "ARTICLE_116", "ARTICLE_149",
]);

type CorpusArticle = { a?: string; p?: string; omitted?: string };

const scheduleEntries: readonly CorpusArticle[] = [
  ...LIMITATION_ACT_1908_CORPUS.schedule.division_1_suits,
  ...LIMITATION_ACT_1908_CORPUS.schedule.division_2_appeals,
  ...LIMITATION_ACT_1908_CORPUS.schedule.division_3_applications,
] as readonly CorpusArticle[];

const corpusById = new Map<string, CorpusArticle>();
for (const e of scheduleEntries) if (e.a) corpusById.set(e.a, e);

function corpusPeriodYears(articleNo: string): number | null {
  const p = corpusById.get(articleNo)?.p;
  if (!p) return null;
  const m = /^(\d+)\s+years?$/i.exec(p.trim());
  return m ? Number(m[1]) : null; // DAY/MONTH periods are not year-comparable
}

describe("P4-04 Batch 1: limitation registry <-> corpus reconciliation", () => {
  it("R1: corpus census — 194 unique First-Schedule entries, 86 covered by 86(a)/(b)", () => {
    expect(scheduleEntries.length).toBe(194);
    const ids = scheduleEntries.map((e) => e.a).filter(Boolean) as string[];
    expect(new Set(ids).size).toBe(194);
    expect(corpusById.has("86")).toBe(false); // split artifact, not a gap
    expect(corpusById.has("86(a)")).toBe(true);
    expect(corpusById.has("86(b)")).toBe(true);
  });

  it("R2: every registry rule has valid, ordered temporal versions", () => {
    for (const rule of new DevelopmentLimitationRegistry().getRules()) {
      expect(rule.temporalVersions.length).toBeGreaterThan(0);
      for (const v of rule.temporalVersions) {
        expect(isISODateString(v.effectiveFrom)).toBe(true);
        expect(v.limitationPeriodYears).toBeGreaterThan(0);
        if (v.effectiveTo) {
          expect(isISODateString(v.effectiveTo)).toBe(true);
          expect(compareISO(v.effectiveTo, v.effectiveFrom)).toBe(1);
        }
      }
    }
  });

  it("R3: schedule commencement — 1909-01-01 or documented amendment date", () => {
    const allowed = new Set(["1909-01-01", "2005-07-01"]);
    for (const rule of new DevelopmentLimitationRegistry().getRules()) {
      for (const v of rule.temporalVersions) {
        expect(allowed.has(v.effectiveFrom)).toBe(true);
      }
    }
  });

  it("R4: every registry article exists in the corpus", () => {
    for (const rule of new DevelopmentLimitationRegistry().getRules()) {
      const no = rule.article.replace(/^ARTICLE_/, "");
      expect(corpusById.has(no)).toBe(true);
    }
  });

  it("R5: registry period matches corpus, except documented review items", () => {
    for (const rule of new DevelopmentLimitationRegistry().getRules()) {
      if (KNOWN_PERIOD_DISCREPANCIES.has(rule.article)) continue;
      const current = rule.temporalVersions[rule.temporalVersions.length - 1];
      const corpusYears = corpusPeriodYears(rule.article.replace(/^ARTICLE_/, ""));
      if (corpusYears === null) continue;
      expect(current.limitationPeriodYears).toBe(corpusYears);
    }
  });

  it("R6: EffectiveDateResolver baseline agrees with Schedule commencement (1909-01-01)", () => {
    expect(getActEffectiveDate()).toBe("1909-01-01");
  });
});
