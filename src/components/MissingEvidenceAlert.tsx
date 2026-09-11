import React from "react";
import { AlertTriangle, ShieldAlert, Info, FileText } from "lucide-react";
import { CaseAnalysisResponse } from "../types/types";

interface MissingEvidenceAlertProps {
  analysis: CaseAnalysisResponse;
}

type EvidenceAlertStage = CaseAnalysisResponse["stage7"];

interface AlertItem {
  title: string;
  detail?: string;
}

export interface MissingEvidenceAlertModel {
  status: "PASS" | "INDETERMINATE" | "FAIL" | "HALT";
  isBlocking: boolean;
  missingEvidence: AlertItem[];
  reasons: string[];
  warnings: string[];
  linkageFailures: string[];
  provenanceFailures: string[];
  unsupportedAssertions: string[];
  rejectedFacts: string[];
  unregisteredDocumentIds: string[];
  custodyStatus: string;
  lifecycleStatus: string;
  extractionHashStatus: string;
}

function formatMissingEvidence(item: unknown): AlertItem {
  if (typeof item === "string") {
    return {
      title: item,
    };
  }

  if (item && typeof item === "object") {
    const candidate = item as {
      predicate?: unknown;
      object?: unknown;
    };

    const predicate =
      typeof candidate.predicate === "string"
        ? candidate.predicate
        : "Required evidence predicate";

    const object =
      typeof candidate.object === "string"
        ? candidate.object
        : undefined;

    return {
      title: predicate,
      detail: object ? `Object: ${object}` : undefined,
    };
  }

  return {
    title: "Required evidence item",
  };
}

export function buildMissingEvidenceAlertModel(
  stage7: EvidenceAlertStage,
): MissingEvidenceAlertModel {
  const integrity = stage7.evidenceIntegrity;

  if (!integrity) {
    return {
      status: "INDETERMINATE",
      isBlocking: false,
      missingEvidence: (stage7.missingEvidence ?? []).map(
        formatMissingEvidence,
      ),
      reasons: [],
      warnings: ["Evidence integrity status is not available in the engine output."],
      linkageFailures: [],
      provenanceFailures: [],
      unsupportedAssertions: [],
      rejectedFacts: [],
      unregisteredDocumentIds: [],
      custodyStatus: "NOT_AVAILABLE",
      lifecycleStatus: "NOT_AVAILABLE",
      extractionHashStatus: "NOT_AVAILABLE",
    };
  }

  return {
    status: integrity.status,
    isBlocking: integrity.isBlocking,
    missingEvidence: (stage7.missingEvidence ?? []).map(
      formatMissingEvidence,
    ),
    reasons: [...integrity.reasons],
    warnings: [...integrity.warnings],
    linkageFailures: [...integrity.linkageFailures],
    provenanceFailures: [...integrity.provenanceFailures],
    unsupportedAssertions: [...integrity.unsupportedAssertions],
    rejectedFacts: [...integrity.rejectedFacts],
    unregisteredDocumentIds: [...integrity.unregisteredDocumentIds],
    custodyStatus: integrity.custodyStatus,
    lifecycleStatus: integrity.lifecycleStatus,
    extractionHashStatus: integrity.extractionHashStatus,
  };
}

function StatusBadge({
  status,
  isBlocking,
}: {
  status: MissingEvidenceAlertModel["status"];
  isBlocking: boolean;
}) {
  const label = isBlocking ? `${status} · BLOCKING` : status;

  if (status === "PASS") {
    return (
      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 border border-emerald-300 bg-emerald-50 text-emerald-800">
        {label}
      </span>
    );
  }

  if (status === "FAIL" || status === "HALT") {
    return (
      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 border border-red-300 bg-red-50 text-red-800">
        {label}
      </span>
    );
  }

  return (
    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 border border-amber-300 bg-amber-50 text-amber-800">
      {label}
    </span>
  );
}

function StringList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#4A5560]">
        {title}
      </div>

      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="text-[11px] leading-relaxed text-[#374151] bg-[#FDFBF7] border border-[#E5E1D8] p-2"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MissingEvidenceAlert({
  analysis,
}: MissingEvidenceAlertProps) {
  const model = buildMissingEvidenceAlertModel(analysis.stage7);

  const hasEvidenceIssues =
    model.missingEvidence.length > 0 ||
    model.reasons.length > 0 ||
    model.warnings.length > 0 ||
    model.linkageFailures.length > 0 ||
    model.provenanceFailures.length > 0 ||
    model.unsupportedAssertions.length > 0 ||
    model.rejectedFacts.length > 0 ||
    model.unregisteredDocumentIds.length > 0 ||
    model.custodyStatus === "FAIL" ||
    model.extractionHashStatus === "MISMATCH";

  if (model.status === "PASS" && !hasEvidenceIssues) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-500 p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-600" />

        <div className="flex gap-3">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded self-start">
            <FileText className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-900">
                Evidence Integrity
              </h4>

              <StatusBadge
                status={model.status}
                isBlocking={model.isBlocking}
              />
            </div>

            <p className="text-[11px] text-emerald-800 leading-relaxed">
              The evidence integrity gate reported no blocking evidence
              integrity failure.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#1E252B] p-6 relative overflow-hidden space-y-5">
      <div className="absolute top-0 right-0 bg-[#C5A059] text-[#1E252B] font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-wider">
        Engine Evidence Audit
      </div>

      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#1E252B]" />

      <div className="border-b border-[#E5E1D8] pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#1E252B] flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-[#C5A059]" />
            Evidence Integrity & Missing Evidence
          </h3>

          <StatusBadge
            status={model.status}
            isBlocking={model.isBlocking}
          />
        </div>

        <p className="text-[11px] text-[#4A5560] mt-2 leading-relaxed">
          This panel displays evidence-integrity results produced by the
          deterministic engine. It does not independently determine legal
          rights, remedies, limitation, maintainability, or statutory
          consequences.
        </p>
      </div>

      {model.missingEvidence.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[9px] font-mono font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 inline-block border border-amber-200">
            Missing Required Evidence
          </div>

          <div className="space-y-2">
            {model.missingEvidence.map((item, index) => (
              <div
                key={`missing-${index}`}
                className="p-3.5 bg-amber-50/40 border-l-4 border-l-amber-500 border border-amber-200/50"
              >
                <div className="flex items-start gap-2.5">
                  <span className="p-0.5 bg-amber-100 text-amber-800 rounded-xs self-start">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>

                  <div className="space-y-1">
                    <strong className="text-amber-950 font-serif text-[13px]">
                      {item.title}
                    </strong>

                    {item.detail && (
                      <p className="text-amber-900 text-[11px] leading-relaxed">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StringList title="Engine Reasons" items={model.reasons} />
      <StringList title="Engine Warnings" items={model.warnings} />
      <StringList
        title="Linkage Failures"
        items={model.linkageFailures}
      />
      <StringList
        title="Provenance Failures"
        items={model.provenanceFailures}
      />
      <StringList
        title="Unsupported Assertions"
        items={model.unsupportedAssertions}
      />
      <StringList title="Rejected Facts" items={model.rejectedFacts} />

      {model.unregisteredDocumentIds.length > 0 && (
        <StringList
          title="Unregistered Document IDs"
          items={model.unregisteredDocumentIds}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="bg-[#FDFBF7] border border-[#E5E1D8] p-3">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#6B7280]">
            Custody
          </div>
          <div className="text-[11px] font-mono font-bold mt-1 text-[#1E252B]">
            {model.custodyStatus}
          </div>
        </div>

        <div className="bg-[#FDFBF7] border border-[#E5E1D8] p-3">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#6B7280]">
            Lifecycle
          </div>
          <div className="text-[11px] font-mono font-bold mt-1 text-[#1E252B]">
            {model.lifecycleStatus}
          </div>
        </div>

        <div className="bg-[#FDFBF7] border border-[#E5E1D8] p-3">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#6B7280]">
            Extraction Hash
          </div>
          <div className="text-[11px] font-mono font-bold mt-1 text-[#1E252B]">
            {model.extractionHashStatus}
          </div>
        </div>
      </div>

      {!hasEvidenceIssues && (
        <div className="flex gap-3 bg-[#FDFBF7] border border-[#E5E1D8] p-3.5">
          <Info className="h-4 w-4 text-[#6B7280] flex-shrink-0" />

          <p className="text-[10px] font-mono text-[#4A5560] leading-relaxed">
            No additional evidence-integrity details were supplied by the
            engine for this execution.
          </p>
        </div>
      )}

      <div className="bg-[#FDFBF7] p-3.5 border border-[#E5E1D8] text-[10px] font-mono text-[#4A5560] leading-relaxed">
        <span className="font-bold text-[#1E252B] uppercase tracking-wider block mb-1">
          Evidence Review Note:
        </span>

        Resolve the evidence items identified by the engine and provide
        appropriate supporting material. Legal conclusions remain subject to
        the engine's validated rule outputs and required human legal review.
      </div>
    </div>
  );
}
