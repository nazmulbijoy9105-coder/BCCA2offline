import type { LimitationArticle } from "../rules/LimitationContracts";

export function limitationArticleToCorpusId(
  article: LimitationArticle,
): string {
  return article.replace(/^ARTICLE_/, "");
}

export function corpusIdToLimitationArticle(
  articleNumber: string | number,
): LimitationArticle | null {
  const normalized = String(articleNumber).trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const article = `ARTICLE_${normalized}`;

  const supported: readonly LimitationArticle[] = [
    "ARTICLE_91",
    "ARTICLE_92",
    "ARTICLE_113",
    "ARTICLE_114",
    "ARTICLE_115",
    "ARTICLE_116",
    "ARTICLE_120",
    "ARTICLE_142",
    "ARTICLE_144",
    "ARTICLE_149",
  ];

  return supported.includes(article as LimitationArticle)
    ? (article as LimitationArticle)
    : null;
}
