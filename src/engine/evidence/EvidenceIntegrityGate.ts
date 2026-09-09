import {
  assertFactHasEvidence,
  type LinkableFact,
} from "./EvidenceLinkageGate";
import {
  findMissingProvenanceFields,
} from "./ProvenanceCompletenessChecker";
import {
  type AssertableFact,
} from "./UnsupportedAssertionGate";
import {
  hasDuplicateFacts,
  type ExtractableFact,
} from "./FactDeduplicator";
import {
  verifyChainOfCustody,
  type CustodialFact,
  type CustodialDocument,
} from "./EvidenceChainOfCustody";
import {
  findMissingEvidence,
  type RequiredFactPredicate,
  type EvaluableFact,
} from "./MissingEvidenceGate";
import { getEvidenceHash } from "./EvidenceIntegrityHasher";

export type EvidenceIntegrityStatus =
  | "PASS"
  | "INDETERMINATE"
  | "FAIL"
  | "HALT";

export type EvidenceIntegrityGateResult = {
  status: EvidenceIntegrityStatus;
  isBlocking: boolean;

  linkageFailures: string[];
  provenanceFailures: string[];
  rejectedFacts: string[];
  unsupportedAssertions: string[];
  duplicateFacts: boolean;

  missingEvidence: readonly RequiredFactPredicate[];

  custodyStatus: "NOT_APPLICABLE" | "PASS" | "FAIL";
  unregisteredDocumentIds: string[];

  lifecycleStatus: "NOT_APPLICABLE" | "AVAILABLE" | "UNAVAILABLE";
  extractionHashStatus: "NOT_AVAILABLE" | "VERIFIED" | "MISMATCH";

  narrativeFactCount: number;
  documentaryFactCount: number;

  warnings: string[];
  reasons: string[];
};

type EvidenceFact = {
  factId: string;
  propositionId: string;
  predicate: string;
  object?: string | null;
  truth: "TRUE" | "FALSE" | "UNKNOWN";
  validationStatus:
    | "UNVERIFIED"
    | "VERIFIED"
    | "CONTRADICTED"
    | "REQUIRES_HUMAN_REVIEW";
  assertionType?: string;
  source?: {
    documentId?: string;
    sourceType?: string;
    extractionMethod?: string;
  };
};

export type EvidenceIntegrityGateInput = {
  facts: readonly EvidenceFact[];

  /**
   * Required evidence predicates are optional because the engine's current
   * evidence model does not yet expose a complete authoritative requirement
   * registry.
   */
  requiredEvidence?: readonly RequiredFactPredicate[];

  /**
   * Documentary custody records are optional. Absence of this registry is
   * reported honestly as unavailable rather than fabricated as PASS.
   */
  custodyDocuments?: readonly CustodialDocument[];

  /**
   * A trusted extraction-time hash must be supplied by an upstream trusted
   * extraction boundary. Never compare a newly generated hash with itself.
   */
  expectedExtractionHash?: string;

  /**
   * Lifecycle records are intentionally optional until the production
   * document-lifecycle registry is integrated.
   */
  lifecycleAvailable?: boolean;
};

export function evaluateEvidenceIntegrity(
  input: EvidenceIntegrityGateInput,
): EvidenceIntegrityGateResult {
  const facts = input.facts;

  const linkageFailures: string[] = [];
  const provenanceFailures: string[] = [];
  const rejectedFacts: string[] = [];
  const unsupportedAssertions: string[] = [];
  const warnings: string[] = [];
  const reasons: string[] = [];

  for (const fact of facts) {
    const linkable: LinkableFact = {
      factId: fact.factId,
      source:
        fact.source?.documentId
          ? {
              documentId: fact.source.documentId,
              segment: "",
              sourceType: fact.source.sourceType ?? "OTHER",
              extractionMethod:
                fact.source.extractionMethod ?? "PATTERN",
            }
          : undefined,
    };

    try {
      assertFactHasEvidence(linkable);
    } catch (error) {
      linkageFailures.push(
        error instanceof Error ? error.message : String(error),
      );
    }

    const missing = findMissingProvenanceFields(fact as never);
    if (missing.length > 0) {
      provenanceFailures.push(
        `${fact.factId}: missing provenance fields: ${missing.join(", ")}`,
      );
    }

    if (fact.validationStatus === "CONTRADICTED") {
      rejectedFacts.push(fact.factId);
    }

    const assertion: AssertableFact = {
      factId: fact.factId,
      propositionId: fact.propositionId,
      truth: fact.truth,
      supportStatus:
        fact.validationStatus === "VERIFIED"
          ? "SUPPORTED"
          : fact.validationStatus === "CONTRADICTED"
            ? "UNSUPPORTED"
            : "UNVERIFIED",
    };

    if (assertion.supportStatus === "UNSUPPORTED") {
      unsupportedAssertions.push(fact.factId);
    }
  }

  const duplicateFacts = hasDuplicateFacts(
    facts.map(
      (fact): ExtractableFact => ({
        factId: fact.factId,
        propositionId: fact.propositionId,
        truth: fact.truth,
        object: fact.object ?? null,
      }),
    ),
  );

  const missingEvidence = input.requiredEvidence
    ? findMissingEvidence(
        input.requiredEvidence,
        facts.map(
          (fact): EvaluableFact => ({
            predicate: fact.predicate,
            object: fact.object ?? undefined,
            verified: fact.validationStatus === "VERIFIED",
          }),
        ),
      )
    : [];

  // A documentary assertion extracted from INPUT_NARRATIVE is still a
  // narrative assertion about a document. It is NOT itself a custody-controlled
  // document record. Chain-of-custody applies only when an actual external
  // document is linked into the evidence boundary.
  const documentaryFacts = facts.filter(
    (fact) =>
      fact.source?.sourceType === "DOCUMENT" ||
      fact.assertionType === "DOCUMENTARY_FACT",
  );

  const narrativeFacts = facts.filter(
    (fact) =>
      fact.source?.sourceType === "INPUT_NARRATIVE" ||
      fact.source?.documentId === "INPUT_NARRATIVE",
  );

  const custodyFacts = documentaryFacts.filter(
    (fact) =>
      fact.source?.documentId &&
      fact.source.documentId !== "INPUT_NARRATIVE" &&
      fact.source.sourceType === "DOCUMENT",
  );

  let custodyStatus: EvidenceIntegrityGateResult["custodyStatus"] =
    "NOT_APPLICABLE";
  let unregisteredDocumentIds: string[] = [];

  if (custodyFacts.length > 0) {
    if (!input.custodyDocuments) {
      custodyStatus = "FAIL";
      reasons.push(
        "External documentary evidence is present but no document custody registry is available.",
      );
    } else {
      const custody = verifyChainOfCustody(
        custodyFacts.map(
          (fact): CustodialFact => ({
            factId: fact.factId,
            source: fact.source?.documentId
              ? { documentId: fact.source.documentId }
              : undefined,
          }),
        ),
        input.custodyDocuments,
      );

      custodyStatus = custody.isValid ? "PASS" : "FAIL";
      unregisteredDocumentIds = custody.unregisteredDocumentIds;

      if (!custody.isValid) {
        reasons.push(
          `Document chain-of-custody failure: ${unregisteredDocumentIds.join(", ")}`,
        );
      }
    }
  }

  const lifecycleStatus: EvidenceIntegrityGateResult["lifecycleStatus"] =
    documentaryFacts.length === 0
      ? "NOT_APPLICABLE"
      : input.lifecycleAvailable
        ? "AVAILABLE"
        : "UNAVAILABLE";

  if (lifecycleStatus === "UNAVAILABLE") {
    warnings.push(
      "Document lifecycle registry is not integrated; stale/revoked evidence cannot be conclusively cleared.",
    );
  }

  let extractionHashStatus: EvidenceIntegrityGateResult["extractionHashStatus"] =
    "NOT_AVAILABLE";

  if (input.expectedExtractionHash) {
    const hashableFacts = facts.map((fact) => ({
      factId: fact.factId,
      predicate: fact.predicate,
      object: fact.object ?? null,
      truth: fact.truth,
      eventDate: null,
    }));

    const actualExtractionHash = getEvidenceHash(hashableFacts);

    extractionHashStatus =
      actualExtractionHash === input.expectedExtractionHash
        ? "VERIFIED"
        : "MISMATCH";

    if (extractionHashStatus === "MISMATCH") {
      reasons.push(
        `Evidence extraction hash mismatch: expected ${input.expectedExtractionHash}, calculated ${actualExtractionHash}.`,
      );
    }
  } else {
    warnings.push(
      "No trusted extraction-time evidence hash is available; hash integrity control is indeterminate.",
    );
  }

  const hasHardFailure =
    linkageFailures.length > 0 ||
    provenanceFailures.length > 0 ||
    rejectedFacts.length > 0 ||
    unsupportedAssertions.length > 0 ||
    custodyStatus === "FAIL" ||
    extractionHashStatus === "MISMATCH";

  if (duplicateFacts) {
    warnings.push(
      "Duplicate canonical facts were detected; deduplication control requires review.",
    );
  }

  if (missingEvidence.length > 0) {
    reasons.push(
      `Required evidence is missing or not verified: ${missingEvidence
        .map((x) => `${x.predicate}${x.object ? `=${x.object}` : ""}`)
        .join(", ")}`,
    );
  }

  if (hasHardFailure) {
    return {
      status: "FAIL",
      isBlocking: true,
      linkageFailures,
      provenanceFailures,
      rejectedFacts,
      unsupportedAssertions,
      duplicateFacts,
      missingEvidence,
      custodyStatus,
      unregisteredDocumentIds,
      lifecycleStatus,
      extractionHashStatus,
      narrativeFactCount: narrativeFacts.length,
      documentaryFactCount: documentaryFacts.length,
      warnings,
      reasons,
    };
  }

  if (missingEvidence.length > 0) {
    return {
      status: "INDETERMINATE",
      isBlocking: true,
      linkageFailures,
      provenanceFailures,
      rejectedFacts,
      unsupportedAssertions,
      duplicateFacts,
      missingEvidence,
      custodyStatus,
      unregisteredDocumentIds,
      lifecycleStatus,
      extractionHashStatus,
      narrativeFactCount: narrativeFacts.length,
      documentaryFactCount: documentaryFacts.length,
      warnings,
      reasons,
    };
  }

  if (
    lifecycleStatus === "UNAVAILABLE" ||
    extractionHashStatus === "NOT_AVAILABLE"
  ) {
    return {
      status: "INDETERMINATE",
      isBlocking: false,
      linkageFailures,
      provenanceFailures,
      rejectedFacts,
      unsupportedAssertions,
      duplicateFacts,
      missingEvidence,
      custodyStatus,
      unregisteredDocumentIds,
      lifecycleStatus,
      extractionHashStatus,
      narrativeFactCount: narrativeFacts.length,
      documentaryFactCount: documentaryFacts.length,
      warnings,
      reasons: [
        ...reasons,
        "Evidence integrity controls are incomplete because trusted lifecycle/hash infrastructure is not yet available.",
      ],
    };
  }

  return {
    status: "PASS",
    isBlocking: false,
    linkageFailures,
    provenanceFailures,
    rejectedFacts,
    unsupportedAssertions,
    duplicateFacts,
    missingEvidence,
    custodyStatus,
    unregisteredDocumentIds,
    lifecycleStatus,
    extractionHashStatus,
    narrativeFactCount: narrativeFacts.length,
    documentaryFactCount: documentaryFacts.length,
    warnings,
    reasons,
  };
}
