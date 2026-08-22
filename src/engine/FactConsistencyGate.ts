import { AtomicFact, FactConflict, FactConsistencyGateOutput } from "../types/types";

/**
 * BCCAA FACT_CONSISTENCY_GATE (F0)
 *
 * Sits directly between G0 (Fact Ingestion) and G1 (Domain Classification).
 * Enforces strict mathematical and logical consistency across all atomic facts.
 *
 * FAIL-CLOSED MANDATE:
 * It is mathematically impossible for G13 (or intermediate gateways G3-G12)
 * to synthesize an unconditioned conclusion from contradictory versions of G0
 * without explicitly blocking or conditioning the analysis.
 */

/**
 * FIX #6: Rich ancestor evaluation result instead of boolean collapse.
 * The gate now receives the full fact evaluation state, not just true/false.
 */
export interface AncestorEvaluationInput {
  status: string;
  supportingFactIds: string[];
  conflictDetected: boolean;
  sameFamilyConflictingFacts?: Array<{
    factId: string;
    object: string | null;
    truth: string;
  }>;
  validationDetails?: {
    sourceStatus: string;
    authenticationStatus: string;
    corroborationStatus: string;
    humanValidationStatus: string;
  };
}

export class FactConsistencyGate {
  /**
   * Evaluates the raw fact pattern and extracted chronology for critical contradictions,
   * temporal clashes, role mutual exclusions, and evidentiary voids.
   *
   * FIX #6: `isAncestorDeceased: boolean` replaced with `ancestorEvaluation: AncestorEvaluationInput | null`.
   * The gate can now make nuanced decisions based on evaluation confidence, conflicts,
   * and validation dimensions — not just a boolean collapse.
   */
  public static evaluate(
    rawText: string,
    chronology: Array<{
      date: string;
      event: string;
      partiesInvolved: string;
      factualSource: string;
      /** FIX #6: Conflict state propagated from engine via chronology. */
      conflictInfo?: {
        total: number;
        critical: number;
        edges: Array<{
          propositionKey: string;
          leftFactId: string;
          rightFactId: string;
          status: string;
        }>;
      };
    }>,
    category: string,
    ancestorEvaluation: AncestorEvaluationInput | null,
  ): FactConsistencyGateOutput {
    const atomicFacts: AtomicFact[] = [];
    const conflicts: FactConflict[] = [];
    const auditTrail: Array<{
      checkId: string;
      checkName: string;
      status: "PASS" | "WARN" | "FAIL";
      details: string;
    }> = [];

    const lower = rawText.toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 1. ATOMIC FACT INGESTION & NORMALIZATION
    // ─────────────────────────────────────────────────────────────
    let factCounter = 1;
    const nextId = () => `FACT-${String(factCounter++).padStart(5, "0")}`;

    // A. Death / Vital Status extraction
    const deathMatches = Array.from(
      rawText.matchAll(
        /(?:died|passed away|demise|death of|expired)\s+(?:on\s+)?([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+[0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/gi,
      ),
    );
    const livingMatches = Array.from(
      rawText.matchAll(
        /\b(?:father is alive|living father|during his lifetime|alive and in possession|ancestor is living|while the father is alive)\b/gi,
      ),
    );

    if (deathMatches.length > 0) {
      deathMatches.forEach((m, idx) => {
        atomicFacts.push({
          factId: nextId(),
          proposition: `Ancestor death event #${idx + 1}`,
          value: { dateString: m[1], rawMatch: m[0] },
          sourceParagraph: m[0],
          factStatus: "ALLEGED",
          temporalStatus: "PAST",
          confidence: 0.95,
          materiality: "CRITICAL",
        });
      });
    }

    if (livingMatches.length > 0) {
      livingMatches.forEach((m, idx) => {
        atomicFacts.push({
          factId: nextId(),
          proposition: `Ancestor vital status assertion (alive) #${idx + 1}`,
          value: { status: "ALIVE", rawMatch: m[0] },
          sourceParagraph: m[0],
          factStatus: "ALLEGED",
          temporalStatus: "CURRENT",
          confidence: 0.9,
          materiality: "CRITICAL",
        });
      });
    }

    // B. Chronology facts ingestion
    chronology.forEach((c) => {
      atomicFacts.push({
        factId: nextId(),
        proposition: `Chronological Event: ${c.event}`,
        value: { date: c.date, parties: c.partiesInvolved },
        sourceParagraph: c.factualSource,
        factStatus: "ALLEGED",
        temporalStatus: "PAST",
        confidence: 0.85,
        materiality: "MATERIAL",
      });
    });

    // C. Contract & Registration facts
    if (lower.includes("bainapatra") || lower.includes("agreement")) {
      const isReg =
        lower.includes("registered") && !lower.includes("unregistered");
      const isUnreg = lower.includes("unregistered");
      atomicFacts.push({
        factId: nextId(),
        proposition: "Execution of written land contract (Bainapatra)",
        value: {
          isRegistered: isReg ? true : isUnreg ? false : "UNKNOWN",
        },
        factStatus: isReg ? "PROVED" : isUnreg ? "DISPUTED" : "UNKNOWN",
        temporalStatus: "PAST",
        confidence: 0.9,
        materiality: "CRITICAL",
      });
    }

    // D. Dispossession / Possession status
    if (
      lower.includes("dispossessed") ||
      lower.includes("ouster") ||
      lower.includes("fence") ||
      lower.includes("trespass")
    ) {
      atomicFacts.push({
        factId: nextId(),
        proposition: "Physical ouster / dispossession from suit land",
        value: { dispossessionAsserted: true },
        factStatus: "DISPUTED",
        temporalStatus: "CURRENT",
        confidence: 0.75,
        materiality: "MATERIAL",
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. CONTRADICTION DETECTION ENGINE (F0 HARD CRITERIA)
    // ─────────────────────────────────────────────────────────────

    // FIX #6: Use rich ancestorEvaluation instead of boolean
    const isAncestorDeceased =
      ancestorEvaluation?.status === "TRUE";
    const ancestorHasConflicts =
      ancestorEvaluation?.conflictDetected === true;

    // CHECK 1: Vital Status Contradiction (Dead vs. Living)
    const hasDeathFact = atomicFacts.some(
      (f) =>
        f.proposition.includes("Ancestor death event") ||
        f.proposition.toLowerCase().includes("demise"),
    );
    const hasLivingFact = atomicFacts.some((f) =>
      f.proposition.includes("vital status assertion (alive)"),
    );
    const textHasDeath = /\b(?:died|demise|passed away|deceased|death of|succession opened)\b/i.test(
      lower,
    );
    const textHasAlive = /\b(?:father is alive|living father|during his lifetime|while the father is alive)\b/i.test(
      lower,
    );

    if (
      (hasDeathFact && hasLivingFact) ||
      (textHasDeath && textHasAlive && category === "INHERITANCE_CONSULTATION")
    ) {
      const deathFactId =
        atomicFacts.find((f) => f.proposition.includes("Ancestor death"))
          ?.factId || "FACT-DEATH-001";
      const livingFactId =
        atomicFacts.find((f) => f.proposition.includes("alive"))?.factId ||
        "FACT-LIVING-001";

      conflicts.push({
        conflictId: `CONF-VITAL-${Date.now().toString(36)}`,
        conflictType: "TEMPORAL_STATUS_CONTRADICTION",
        severity: "CRITICAL",
        factIdA: deathFactId,
        factIdB: livingFactId,
        description:
          "Direct temporal contradiction: The record simultaneously asserts that the ancestor is deceased (opening statutory inheritance) AND that the ancestor is currently living (holding absolute lifetime ownership without cause of action).",
        affectedGateways: [1, 3, 4, 7, 9, 10, 13],
        resolutionRequirement:
          "Must file certified Municipal / Union Parishad Death Certificate or confirm living status before limitation or heirship shares can be calculated.",
      });

      auditTrail.push({
        checkId: "CHK-F0-001",
        checkName: "Ancestor Vital Status Consistency",
        status: "FAIL",
        details:
          "Contradiction found: Simultaneous assertions of deceased ancestor and living ancestor.",
      });
    } else {
      auditTrail.push({
        checkId: "CHK-F0-001",
        checkName: "Ancestor Vital Status Consistency",
        status: "PASS",
        details:
          "Vital status of parties is internally consistent throughout the record.",
      });
    }

    // CHECK 2: Multiple Conflicting Death Dates
    const extractedDeathDates: string[] = [];
    deathMatches.forEach((m) => extractedDeathDates.push(m[1].trim()));
    const deathChronos = chronology.filter(
      (c) =>
        c.event.toLowerCase().includes("demise") ||
        c.event.toLowerCase().includes("died") ||
        c.event.toLowerCase().includes("death"),
    );
    deathChronos.forEach((dc) => extractedDeathDates
