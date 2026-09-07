import type {
  OutputRegistry,
  MemoSchema,
} from "./OutputContracts";

/**
 * Development Output Registry.
 * P10-01: Authoritative source of truth for the legal memo schema.
 */
const MEMO_SCHEMA: MemoSchema = {
  schemaId: "BD-MEMO-SCHEMA-V1",
  version: "1.0",
  sections: [
    {
      sectionType: "FACTUAL_SUMMARY",
      required: true,
      description: "Deterministic summary of verified facts only.",
    },
    {
      sectionType: "LEGAL_ISSUES",
      required: true,
      description: "Strict framing of legal issues based on applied rules.",
    },
    {
      sectionType: "ARGUMENTS",
      required: true,
      description: "Arguments strictly mapped to fact-to-conclusion traceability.",
    },
    {
      sectionType: "CONCLUSION",
      required: true,
      description: "Final conclusion explicitly tied to deterministic engine output.",
    },
    {
      sectionType: "UNCERTAINTY_DISCLOSURE",
      required: true,
      description: "Mandatory disclosure of any INDETERMINATE verdicts.",
    },
    {
      sectionType: "CONTRADICTION_DISCLOSURE",
      required: true,
      description: "Mandatory disclosure of any unresolved factual disputes.",
    },
    {
      sectionType: "CITATION_PROVENANCE",
      required: true,
      description: "List of all authoritative citations used, mapped to the corpus hash.",
    },
  ],
};

export class DevelopmentOutputRegistry implements OutputRegistry {
  getSchema(): MemoSchema {
    return MEMO_SCHEMA;
  }
}
