import { describe, expect, it } from "vitest";
import {
  getArticleMetadata,
  formatArticleReference,
  assertLimitationArticleBoundToCorpus,
} from "./LimitationArticleMapper";

describe("LimitationArticleMapper", () => {
  it("normalizes ARTICLE_114 to corpus article 114", () => {
    expect(getArticleMetadata("ARTICLE_114")?.a).toBe("114");
  });

  it("accepts numeric article identifiers", () => {
    expect(getArticleMetadata(120)?.a).toBe("120");
  });

  it("rejects malformed article identifiers", () => {
    expect(getArticleMetadata("ARTICLE_XYZ")).toBeNull();
  });

  it("binds supported limitation articles to authoritative corpus entries", () => {
    expect(
      assertLimitationArticleBoundToCorpus("ARTICLE_149").a,
    ).toBe("149");
  });

  it("formats a canonical Article 113 reference", () => {
    expect(formatArticleReference("ARTICLE_113")).toContain(
      "Article 113",
    );
  });
});
