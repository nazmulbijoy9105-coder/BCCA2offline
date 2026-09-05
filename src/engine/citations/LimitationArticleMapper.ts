import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";

type CorpusArticle = {
  a: string;
  d: string;
  p: string;
  pv: number;
  pu: string;
  s: string;
  note?: string;
  omitted?: string;
};

/**
 * P6-03: Authoritative Section/Article Mapper.
 * 
 * Extracts structured Article metadata from the deterministic corpus.
 * Prevents LLM hallucination by binding article references to exact statutory text.
 */
export function getArticleMetadata(articleNumber: string | number): CorpusArticle | null {
  const articleStr = String(articleNumber).trim();
  
  // Search across all schedule divisions
  const divisions = [
    ...LIMITATION_ACT_1908_CORPUS.schedule.division_1_suits,
    ...LIMITATION_ACT_1908_CORPUS.schedule.division_2_appeals,
    ...LIMITATION_ACT_1908_CORPUS.schedule.division_3_applications,
  ] as const;

  const found = divisions.find((art) => art.a === articleStr);
  
  if (!found || ("omitted" in found && found.omitted)) {
    return null;
  }

  return found as CorpusArticle;
}

/**
 * Formats the article reference for display, enforcing the exact statutory description.
 */
export function formatArticleReference(articleNumber: string | number): string {
  const meta = getArticleMetadata(articleNumber);
  if (!meta) {
    return `Article ${articleNumber} (Not found in authoritative corpus)`;
  }
  return `Article ${meta.a} | ${meta.d} | Period: ${meta.p} | Accrual: ${meta.s}`;
}
