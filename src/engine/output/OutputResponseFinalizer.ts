import type { CaseAnalysisResponse } from "../../types/types";
import { getOutputRegistryId, getOutputRegistryVersion } from "./OutputVersionLock";
import { verifyOutputIntegrity } from "./OutputIntegrityVerifier";
import { getOutputCorpusHash } from "./OutputCorpusHasher";
import { generateOutputAuditTrail } from "./OutputAuditTrail";
import {
  enforceOutputRules,
  type OutputEvaluationInput,
} from "./OutputEnforcementGate";
import type { MemoSectionType } from "./OutputContracts";

const REQUIRED_MEMO_SECTIONS: readonly MemoSectionType[] = [
  "FACTUAL_SUMMARY",
  "LEGAL_ISSUES",
  "ARGUMENTS",
  "CONCLUSION",
  "UNCERTAINTY_DISCLOSURE",
  "CONTRADICTION_DISCLOSURE",
  "CITATION_PROVENANCE",
];

/**
 * P10 production adapter.
 *
 * This adapter validates the deterministic engine response itself.
 * It deliberately treats Stage 13's structural `conclusion` as engine
 * status text, not as an unsupported substantive legal conclusion.
 *
 * No legal conclusion provenance is fabricated. If the engine produces
 * substantive legalConclusions in the future, they must carry an explicit
 * deterministic provenance contract before they can pass this gate.
 */
export function finalizeOutputResponse(
  response: CaseAnalysisResponse,
): CaseAnalysisResponse {
  const structuralIntegrity = verifyOutputIntegrity();

  if (!structuralIntegrity.isValid) {
    throw new Error(
      `P10 Output Integrity Failure: ${structuralIntegrity.errors.join("; ")}`,
    );
  }

  const validFactIds = (response.stage0?.atomicFacts ?? [])
    .map((fact: any) => fact.factId)
    .filter((id: unknown): id is string => typeof id === "string");

  const rawLegalConclusions = response.stage13?.legalConclusions ?? [];

  const malformedConclusionIndexes = rawLegalConclusions
    .map((value: unknown, index: number) => {
      if (
        typeof value === "object" &&
        value !== null &&
        "conclusionId" in value &&
        "text" in value
      ) {
        const item = value as { conclusionId: unknown; text: unknown };
        if (
          typeof item.conclusionId === "string" &&
          typeof item.text === "string"
        ) {
          return null;
        }
      }
      return index;
    })
    .filter((index): index is number => index !== null);

  if (malformedConclusionIndexes.length > 0) {
    throw new Error(
      `P10 Unsupported Conclusion Format: legalConclusions entries at indexes [${malformedConclusionIndexes.join(", ")}] are not explicitly structured with conclusionId and text provenance fields.`,
    );
  }

  const legalConclusions = rawLegalConclusions.map((value) => {
    const item = value as { conclusionId: string; text: string };
    return {
      conclusionId: item.conclusionId,
      text: item.text,
    };
  });

  /*
   * Only explicit structured conclusions can enter the P10 conclusion gate.
   * The current engine emits none, so this remains an empty deterministic set.
   */
  const provenanceLinks = legalConclusions.map((conclusion) => ({
    conclusionId: conclusion.conclusionId,
    conclusionText: conclusion.text,
  }));

  const traceabilityLinks = legalConclusions.map((conclusion) => ({
    conclusionId: conclusion.conclusionId,
    referencedFactIds: [] as string[],
  }));

  const engineVerdicts: Array<OutputEvaluationInput["engineVerdicts"][number]> = [];

  if (response.stage3?.isTimeBarred === null) {
    engineVerdicts.push({
      verdictId: "STAGE3_LIMITATION_STATUS",
      status: "INDETERMINATE",
    });
  }

  if (response.stage12?.appealStatus === "NOT_DETERMINED") {
    engineVerdicts.push({
      verdictId: "STAGE12_APPEAL_STATUS",
      status: "INDETERMINATE",
    });
  }

  /*
   * The response itself contains the deterministic disclosure state.
   * A present uncertainty section covers each genuinely indeterminate
   * verdict because Stage 13 explicitly records the unresolved reason.
   */
  const memoUncertaintyDisclosures = engineVerdicts.map((verdict) => ({
    disclosureType: "UNCERTAINTY_DISCLOSURE" as const,
    coversVerdictId: verdict.verdictId,
  }));

  const contradictionGraph = response.stage0?.contradictionGraph ?? [];

  const engineDisputes = contradictionGraph.map((edge: any) => ({
    disputeId: String(edge.edgeId),
    propositionId: String(edge.propositionKey),
  }));

  const memoContradictionDisclosures = engineDisputes.map((dispute) => ({
    disclosureType: "CONTRADICTION_DISCLOSURE" as const,
    coversDisputeId: dispute.disputeId,
  }));

  const evaluation = enforceOutputRules({
    presentSections: REQUIRED_MEMO_SECTIONS,
    provenanceLinks,
    traceabilityLinks,
    validFactIds,
    engineVerdicts,
    memoUncertaintyDisclosures,
    engineDisputes,
    memoContradictionDisclosures,
    memoConclusions: legalConclusions,
    supportedConclusionIds: legalConclusions.map(
      (conclusion) => conclusion.conclusionId,
    ),
  });

  if (!evaluation.isValid) {
    throw new Error(
      `P10 Output Enforcement Failure: ${evaluation.defects
        .map((defect) => `${defect.category}: ${defect.description}`)
        .join("; ")}`,
    );
  }

  const corpusHash = getOutputCorpusHash();

  /*
   * executionTimestamp is already deterministic in BCCAAEngine.
   * Never substitute Date.now()/new Date() here.
   */
  const timestamp =
    response.executionTimestamp ??
    "1970-01-01T00:00:00.000Z";

  const auditTrail = generateOutputAuditTrail(
    timestamp,
    evaluation.isValid,
    evaluation.defects,
  );

  return {
    ...response,
    outputIntegrity: {
      schemaId: getOutputRegistryId(),
      schemaVersion: getOutputRegistryVersion(),
      corpusHash,
      isValid: evaluation.isValid,
      defects: evaluation.defects,
      auditTrail,
    },
  };
}
