/**
 * P10-01: Output / Legal Memo Integrity Contracts.
 * 
 * Establishes the authoritative registry types for the final legal memo.
 * Prevents LLM hallucination by enforcing a strict schema.
 */

export type MemoSectionType = 
  | "FACTUAL_SUMMARY" 
  | "LEGAL_ISSUES" 
  | "ARGUMENTS" 
  | "CONCLUSION" 
  | "UNCERTAINTY_DISCLOSURE" 
  | "CONTRADICTION_DISCLOSURE" 
  | "CITATION_PROVENANCE";

export type MemoSection = {
  sectionType: MemoSectionType;
  required: boolean;
  description: string;
};

export type MemoSchema = {
  schemaId: string;
  version: string;
  sections: readonly MemoSection[];
};

export type OutputRegistry = {
  getSchema(): MemoSchema;
};
