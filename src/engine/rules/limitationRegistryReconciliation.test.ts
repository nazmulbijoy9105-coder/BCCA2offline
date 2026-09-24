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

/**
 * No statutory period discrepancies are permitted in the active
 * limitation registry. Historical audit exceptions must not be used
 * to make an incorrect legal rule pass reconciliation.
 */
const KNOWN_PERIOD_DISCREPANCIES = new Set<string>();

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


describe("Article 120 residual-rule selection", () => {
  const registry = new DevelopmentLimitationRegistry();

  it("does not expose Article 120 through ordinary candidate selection", () => {
    const claimTypes = [
      "GENERAL_CIVIL",
      "DECLARATION",
      "DECLARATION_AND_POSSESSION",
      "CANCELLATION",
      "SET_ASIDE",
      "FORGERY_DECLARATION",
      "INHERITANCE_CONSULTATION",
    ];

    for (const claimType of claimTypes) {
      const candidates = registry.getCandidateRules(claimType);
      expect(
        candidates.some((rule) => rule.article === "ARTICLE_120"),
      ).toBe(false);
    }
  });

  it("exposes exactly one explicit residual rule", () => {
    const residual = registry.getResidualRule();

    expect(residual).not.toBeNull();
    expect(residual?.article).toBe("ARTICLE_120");
    expect(residual?.applicability.residualRule).toBe(true);
  });
});
