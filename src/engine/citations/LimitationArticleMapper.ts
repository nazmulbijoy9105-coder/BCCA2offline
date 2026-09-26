import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";
import {
  limitationArticleToCorpusId,
} from "./CanonicalLimitationArticle";
import type { LimitationArticle } from "../rules/LimitationContracts";

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

function isCorpusArticle(value: unknown): value is CorpusArticle {
  if (!value || typeof value !== "object") return false;

  const article = value as Record<string, unknown>;

  return (
    typeof article.a === "string" &&
    typeof article.d === "string" &&
    typeof article.p === "string" &&
    typeof article.pv === "number" &&
    typeof article.pu === "string" &&
    typeof article.s === "string"
  );
}

export function getArticleMetadata(
  articleNumber: string | number | LimitationArticle,
): CorpusArticle | null {
  const raw = String(articleNumber).trim();

  const articleStr = raw.startsWith("ARTICLE_")
    ? raw.replace(/^ARTICLE_/, "")
    : raw;

  if (!/^\d+$/.test(articleStr)) {
    return null;
  }

  const divisions = [
    ...LIMITATION_ACT_1908_CORPUS.schedule.division_1_suits,
    ...LIMITATION_ACT_1908_CORPUS.schedule.division_2_appeals,
    ...LIMITATION_ACT_1908_CORPUS.schedule.division_3_applications,
  ] as readonly unknown[];

  const found = divisions.find(
    (article): article is CorpusArticle =>
      isCorpusArticle(article) &&
      article.a === articleStr,
  );

  if (
    !found ||
    ("omitted" in found && found.omitted)
  ) {
    return null;
  }

  return found;
}

export function formatArticleReference(
  articleNumber: string | number | LimitationArticle,
): string {
  const meta = getArticleMetadata(articleNumber);

  if (!meta) {
    return `Article ${articleNumber} (Not found in authoritative corpus)`;
  }

  return `Article ${meta.a} | ${meta.d} | Period: ${meta.p} | Accrual: ${meta.s}`;
}

export function assertLimitationArticleBoundToCorpus(
  article: LimitationArticle,
): CorpusArticle {
  const corpusId = limitationArticleToCorpusId(article);
  const metadata = getArticleMetadata(corpusId);

  if (!metadata) {
    throw new Error(
      `Limitation corpus binding failure: ${article} is not present in the authoritative corpus`,
    );
  }

  return metadata;
}
