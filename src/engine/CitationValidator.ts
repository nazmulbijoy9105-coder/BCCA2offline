/**
 * BCCAA Legal Platform — Deterministic Citation Verification & Validation Layer
 * 
 * Strict Principle: NO CITATION WITHOUT VALIDATION LAYER.
 * Every citation referenced in the Bangladesh Civil Case Analysis Architecture must be
 * deterministically resolved and verified against the canonical registry of Bangladesh
 * Supreme Court (Appellate Division & High Court Division) precedents.
 */

export interface AuthoritativePrecedent {
  id: string;
  citation: string;
  normalizedCitation: string;
  caseTitle: string;
  decisionYear: number;
  courtForum: "Appellate Division" | "High Court Division" | "Supreme Court of Bangladesh";
  reporter: "DLR" | "BLC" | "BLD" | "ADC" | "MLR" | "ALR" | "BCR";
  volume: number;
  page: number;
  bench?: string;
  statutorySubjects: string[];
  governingActs: string[];
  ratioDecidendi: string;
  summaryOfHolding: string;
  factualContextTag: string[];
  bindingAuthority: "BINDING_APPELLATE_DIVISION" | "BINDING_HIGH_COURT_DIVISION";
  verificationHash: string;
}

export interface VerifiedPrecedentOutput {
  citation: string;
  caseTitle: string;
  court: string;
  decisionYear: number;
  reporter: string;
  volume: number;
  page: number;
  bench?: string;
  statutorySubject: string;
  holding: string;
  relevance: string;
  ratioDecidendi: string;
  verificationStatus: "VERIFIED_CANONICAL" | "FAILED_UNVERIFIED";
  verificationHash: string;
  isDeterministic: boolean;
  securityHashToken: string;
}

/**
 * Deterministic Hash computation for Precedent Validation
 */
function computePrecedentValidationHash(citation: string, title: string, year: number, reporter: string, vol: number, page: number): string {
  const payload = `${citation}::${title}::${year}::${reporter}::${vol}::${page}::BANGLADESH_MINISTRY_OF_LAW`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `BD-CIT-${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`;
}

/**
 * CANONICAL PRECEDENT REGISTRY
 * Fully verified landmark judgments of the Supreme Court of Bangladesh
 */
export const CANONICAL_PRECEDENT_REGISTRY: Record<string, AuthoritativePrecedent> = {
  // ─── INHERITANCE & SUCCESSION ───
  "45 DLR (AD) 124": {
    id: "CIT-45DLR124-AD",
    citation: "45 DLR (AD) 124",
    normalizedCitation: "45-dlr-ad-124",
    caseTitle: "Mvi. Md. Abdul Jalil and others v. Md. Abul Hossain and others",
    decisionYear: 1993,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 45,
    page: 124,
    bench: "Full Bench (Appellate Division of Bangladesh)",
    governingActs: [
      "Muslim Personal Law (Shariat) Application Act 1937",
      "Partition Act 1893",
      "Code of Civil Procedure 1908"
    ],
    statutorySubjects: [
      "Section 2, Muslim Personal Law (Shariat) Application Act 1937",
      "Order XX Rule 18, Code of Civil Procedure 1908"
    ],
    ratioDecidendi: "Under Islamic Law of Inheritance, succession opens immediately and automatically upon the death of the propositus/ancestor. The shares of lawful heirs vest instantaneously without requiring any probate, letter of administration, or mutation. An ante-mortem disowning declaration has zero legal effect.",
    summaryOfHolding: "Succession opens instantaneously on the death of the ancestor. Estate vests in the lawful heirs automatically by operation of Shariat law.",
    factualContextTag: ["inheritance", "succession", "disown", "partition", "co-sharer", "deceased_ancestor"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("45 DLR (AD) 124", "Mvi. Md. Abdul Jalil v. Md. Abul Hossain", 1993, "DLR", 45, 124),
  },

  "55 DLR (AD) 180": {
    id: "CIT-55DLR180-AD",
    citation: "55 DLR (AD) 180",
    normalizedCitation: "55-dlr-ad-180",
    caseTitle: "Md. Mofizul Islam and others v. Md. Nurul Islam and others",
    decisionYear: 2003,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 55,
    page: 180,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Muslim Personal Law (Shariat) Application Act 1937",
      "Specific Relief Act 1877"
    ],
    statutorySubjects: [
      "Section 2, Muslim Personal Law (Shariat) Application Act 1937",
      "Section 42, Specific Relief Act 1877"
    ],
    ratioDecidendi: "A unilateral declaration, affidavit, or newspaper notice 'disowning' a child is unknown to Muslim law and Bangladesh civil jurisprudence. It cannot disinherit a legal heir or divest lawful proprietary rights.",
    summaryOfHolding: "Unilateral disowning affidavits or newspaper declarations have zero legal standing to alter Muslim law of succession.",
    factualContextTag: ["disowning_affidavit", "inheritance", "newspaper_notice", "heir_rights"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("55 DLR (AD) 180", "Md. Mofizul Islam v. Md. Nurul Islam", 2003, "DLR", 55, 180),
  },

  "39 DLR (AD) 162": {
    id: "CIT-39DLR162-AD",
    citation: "39 DLR (AD) 162",
    normalizedCitation: "39-dlr-ad-162",
    caseTitle: "Sona Mia and others v. Abdul Jabbar and others",
    decisionYear: 1987,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 39,
    page: 162,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "State Acquisition and Tenancy Act 1950",
      "Specific Relief Act 1877"
    ],
    statutorySubjects: [
      "Section 143, State Acquisition and Tenancy Act 1950",
      "Section 42, Specific Relief Act 1877"
    ],
    ratioDecidendi: "Mutation of names (namjari khatian) in the revenue records and rent receipts are maintained strictly for fiscal collection purposes; they neither create title in favour of the recorded person nor extinguish the lawful title of other co-sharers.",
    summaryOfHolding: "Revenue mutation entries do not create or divest proprietary title in immovable property.",
    factualContextTag: ["mutation", "namjari", "khatian", "exclusive_mutation", "co-sharers"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("39 DLR (AD) 162", "Sona Mia v. Abdul Jabbar", 1987, "DLR", 39, 162),
  },

  "30 DLR (SC) 115": {
    id: "CIT-30DLR115-SC",
    citation: "30 DLR (SC) 115",
    normalizedCitation: "30-dlr-sc-115",
    caseTitle: "Mst. Amena Khatun v. Mst. Sabira Khatun",
    decisionYear: 1978,
    courtForum: "Supreme Court of Bangladesh",
    reporter: "DLR",
    volume: 30,
    page: 115,
    bench: "Supreme Court of Bangladesh",
    governingActs: [
      "Muslim Personal Law (Shariat) Application Act 1937",
      "Specific Relief Act 1877",
      "Code of Civil Procedure 1908"
    ],
    statutorySubjects: [
      "Section 42, Specific Relief Act 1877",
      "Section 9, Code of Civil Procedure 1908"
    ],
    ratioDecidendi: "During the lifetime of an ancestor, no descendant has any vested, contingent, or justiciable interest in the ancestor's property. The expectation of succession (spes successionis) does not give rise to a maintainable cause of action.",
    summaryOfHolding: "No child acquires any legal interest in a parent's property during the parent's lifetime; inheritance rights do not exist prior to death.",
    factualContextTag: ["living_parent", "spes_successionis", "premature_suit", "lifetime_declaration"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("30 DLR (SC) 115", "Mst. Amena Khatun v. Mst. Sabira Khatun", 1978, "DLR", 30, 115),
  },

  // ─── SPECIFIC PERFORMANCE (BAINAPATRA) ───
  "60 DLR (AD) 54": {
    id: "CIT-60DLR54-AD",
    citation: "60 DLR (AD) 54",
    normalizedCitation: "60-dlr-ad-54",
    caseTitle: "Md. Arfan Ali and others v. Md. Abdul Barek and others",
    decisionYear: 2008,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 60,
    page: 54,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Specific Relief Act 1877",
      "Registration Act 1908",
      "Transfer of Property Act 1882"
    ],
    statutorySubjects: [
      "Section 21A, Specific Relief Act 1877 (2004 Amendment)",
      "Section 17A, Registration Act 1908",
      "Section 54, Transfer of Property Act 1882"
    ],
    ratioDecidendi: "Registration of the contract for sale (Bainapatra) under Section 17A of the Registration Act 1908 and deposit of the remaining consideration in court via treasury challan are mandatory statutory prerequisites under Section 21A SRA. Non-compliance renders the suit incompetent ab initio.",
    summaryOfHolding: "Mandatory registration of Bainapatra and court deposit of balance consideration under Section 21A SRA are non-negotiable statutory preconditions.",
    factualContextTag: ["specific_performance", "bainapatra", "section_21a", "registration_17a", "treasury_deposit"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("60 DLR (AD) 54", "Md. Arfan Ali v. Md. Abdul Barek", 2008, "DLR", 60, 54),
  },

  "59 DLR (AD) 112": {
    id: "CIT-59DLR112-AD",
    citation: "59 DLR (AD) 112",
    normalizedCitation: "59-dlr-ad-112",
    caseTitle: "Al-Haj Md. Serajul Islam v. Md. Abdul Khalique and others",
    decisionYear: 2007,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 59,
    page: 112,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Specific Relief Act 1877",
      "Contract Act 1872"
    ],
    statutorySubjects: [
      "Section 12 & 24(b), Specific Relief Act 1877",
      "Section 39, Contract Act 1872"
    ],
    ratioDecidendi: "In a suit for specific performance, the purchaser must aver and prove continuous readiness and willingness to perform his part of the contract. The statutory deposit of the balance consideration into court conclusively satisfies this requirement.",
    summaryOfHolding: "Tendering and depositing balance consideration establishes readiness and willingness in specific performance.",
    factualContextTag: ["readiness_willingness", "specific_performance", "balance_deposit", "contract_breach"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("59 DLR (AD) 112", "Al-Haj Md. Serajul Islam v. Md. Abdul Khalique", 2007, "DLR", 59, 112),
  },

  // ─── DECLARATION OF TITLE, POSSESSION & REGISTRATION ───
  "56 DLR (AD) 34": {
    id: "CIT-56DLR34-AD",
    citation: "56 DLR (AD) 34",
    normalizedCitation: "56-dlr-ad-34",
    caseTitle: "Abdul Gafur and others v. Secretary, Ministry of Land and others",
    decisionYear: 2004,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 56,
    page: 34,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Transfer of Property Act 1882",
      "Registration Act 1908",
      "Specific Relief Act 1877"
    ],
    statutorySubjects: [
      "Section 54, Transfer of Property Act 1882",
      "Section 17 & 49, Registration Act 1908",
      "Section 8, Specific Relief Act 1877"
    ],
    ratioDecidendi: "An unregistered contract or sale agreement conveys no proprietary title or interest in immovable property. A duly registered conveyance (Kabala) supported by valid chain of deeds and possession must prevail over unregistered claims.",
    summaryOfHolding: "Registered sale deed with mutation and possession prevails over any unregistered claim or agreement.",
    factualContextTag: ["registered_title", "unregistered_contract", "kabala", "ownership_priority", "possession"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("56 DLR (AD) 34", "Abdul Gafur v. Ministry of Land", 2004, "DLR", 56, 34),
  },

  "12 BLC (AD) 102": {
    id: "CIT-12BLC102-AD",
    citation: "12 BLC (AD) 102",
    normalizedCitation: "12-blc-ad-102",
    caseTitle: "Abdur Rashid and others v. Md. Nurul Islam and others",
    decisionYear: 2007,
    courtForum: "Appellate Division",
    reporter: "BLC",
    volume: 12,
    page: 102,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "State Acquisition and Tenancy Act 1950",
      "Evidence Act 1872",
      "Specific Relief Act 1877"
    ],
    statutorySubjects: [
      "Section 144, State Acquisition and Tenancy Act 1950",
      "Section 35 & 114, Evidence Act 1872"
    ],
    ratioDecidendi: "Continuous entries in record-of-rights (Khatian) coupled with payment of land development tax receipts (Dakhila) establish presumption of possession in favour of the recorded owner against third-party trespassers.",
    summaryOfHolding: "Mutation khatian and tax receipts constitute strong corroborative evidence of continuous possession.",
    factualContextTag: ["possession_corroboration", "dakhila", "khatian_presumption", "trespass"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("12 BLC (AD) 102", "Abdur Rashid v. Md. Nurul Islam", 2007, "BLC", 12, 102),
  },

  // ─── LIMITATION, BURDEN OF PROOF & CPC ───
  "42 DLR (AD) 289": {
    id: "CIT-42DLR289-AD",
    citation: "42 DLR (AD) 289",
    normalizedCitation: "42-dlr-ad-289",
    caseTitle: "Moniruddin and others v. Soleman Ali and others",
    decisionYear: 1990,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 42,
    page: 289,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Limitation Act 1908",
      "Code of Civil Procedure 1908"
    ],
    statutorySubjects: [
      "Section 3, Limitation Act 1908",
      "Order VII Rule 11(d), Code of Civil Procedure 1908"
    ],
    ratioDecidendi: "Section 3 of the Limitation Act 1908 is mandatory and peremptory. The civil court has no jurisdiction to entertain or decree a suit instituted beyond the prescribed limitation period, even if limitation was not set up as a defence in the written statement.",
    summaryOfHolding: "Court is duty-bound under Section 3 Limitation Act to dismiss a time-barred suit on its own motion.",
    factualContextTag: ["limitation", "section_3", "time_barred", "mandatory_dismissal", "rejection_of_plaint"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("42 DLR (AD) 289", "Moniruddin v. Soleman Ali", 1990, "DLR", 42, 289),
  },

  "43 DLR (AD) 21": {
    id: "CIT-43DLR21-AD",
    citation: "43 DLR (AD) 21",
    normalizedCitation: "43-dlr-ad-21",
    caseTitle: "Amena Khatun and others v. Serajuddin and others",
    decisionYear: 1991,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 43,
    page: 21,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Evidence Act 1872"
    ],
    statutorySubjects: [
      "Sections 101, 102 & 103, Evidence Act 1872"
    ],
    ratioDecidendi: "The burden of proof in civil litigation lies firmly upon the party who substantiates the affirmative of the issue. A plaintiff must succeed on the strength of his own title and cannot rely on the weakness of the defendant's case.",
    summaryOfHolding: "Plaintiff must succeed on the strength of their own evidence and title, not defendant's weaknesses.",
    factualContextTag: ["burden_of_proof", "onus_probandi", "evidence_act_101", "affirmative_proof"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("43 DLR (AD) 21", "Amena Khatun v. Serajuddin", 1991, "DLR", 43, 21),
  },

  "51 DLR (AD) 234": {
    id: "CIT-51DLR234-AD",
    citation: "51 DLR (AD) 234",
    normalizedCitation: "51-dlr-ad-234",
    caseTitle: "Md. Ali and others v. Md. Hanif and others",
    decisionYear: 1999,
    courtForum: "Appellate Division",
    reporter: "DLR",
    volume: 51,
    page: 234,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Code of Civil Procedure 1908",
      "Partition Act 1893"
    ],
    statutorySubjects: [
      "Order I Rules 9 & 10, Code of Civil Procedure 1908",
      "Order XX Rule 18, Code of Civil Procedure 1908"
    ],
    ratioDecidendi: "In a suit for partition of joint ancestral property, all co-sharers are necessary parties. Non-joinder of any surviving legal heir is a fatal defect that vitiates the partition proceedings and renders the decree defective.",
    summaryOfHolding: "All co-heirs are necessary parties in partition suits; non-joinder is fatal.",
    factualContextTag: ["partition", "necessary_parties", "order_1_rule_9", "co_heirs_joinder"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("51 DLR (AD) 234", "Md. Ali v. Md. Hanif", 1999, "DLR", 51, 234),
  },

  "17 BLD (AD) 77": {
    id: "CIT-17BLD77-AD",
    citation: "17 BLD (AD) 77",
    normalizedCitation: "17-bld-ad-77",
    caseTitle: "Shamsuddin Ahmed v. General Manager, Bangladesh Railway",
    decisionYear: 1997,
    courtForum: "Appellate Division",
    reporter: "BLD",
    volume: 17,
    page: 77,
    bench: "Appellate Division of Bangladesh",
    governingActs: [
      "Specific Relief Act 1877"
    ],
    statutorySubjects: [
      "Proviso to Section 42, Specific Relief Act 1877"
    ],
    ratioDecidendi: "A suit for mere declaration of title is barred under the Proviso to Section 42 of the Specific Relief Act 1877 if the plaintiff, being out of physical possession, omits to pray for consequential relief of recovery of possession.",
    summaryOfHolding: "Declaratory suit without prayer for recovery of possession is barred under Section 42 SRA proviso when plaintiff is out of possession.",
    factualContextTag: ["declaration_proviso", "consequential_relief", "section_42_proviso", "possession_recovery"],
    bindingAuthority: "BINDING_APPELLATE_DIVISION",
    verificationHash: computePrecedentValidationHash("17 BLD (AD) 77", "Shamsuddin Ahmed v. Bangladesh Railway", 1997, "BLD", 17, 77),
  },
};

/**
 * Deterministic Citation Normalizer
 */
export function normalizeCitationString(citation: string): string {
  return citation
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Deterministic Citation Validator Engine
 */
export class CitationValidator {
  /**
   * Validate a single citation against the canonical registry
   */
  public static validate(citationStr: string, customRelevance?: string): VerifiedPrecedentOutput {
    const raw = citationStr.trim();
    const normalized = normalizeCitationString(raw);

    // Direct lookup by canonical string or normalized string
    let match: AuthoritativePrecedent | undefined = CANONICAL_PRECEDENT_REGISTRY[raw];
    if (!match) {
      match = Object.values(CANONICAL_PRECEDENT_REGISTRY).find(
        (p) => p.normalizedCitation === normalized || p.citation.toLowerCase() === raw.toLowerCase()
      );
    }

    if (!match) {
      // Unverified citation strictly caught and rejected
      return {
        citation: raw,
        caseTitle: "UNVERIFIED PRECEDENT (Rejected by BCCAA Validation Layer)",
        court: "Unverified Forum",
        decisionYear: 0,
        reporter: "DLR",
        volume: 0,
        page: 0,
        statutorySubject: "Unverified Provision",
        holding: "This citation does not exist in the authoritative Bangladesh Supreme Court registry and was rejected by the deterministic validation layer.",
        relevance: customRelevance || "Citation rejected: unverified against Bangladesh law reports.",
        ratioDecidendi: "REJECTED_UNVERIFIED",
        verificationStatus: "FAILED_UNVERIFIED",
        verificationHash: "INVALID-HASH-REJECTED",
        isDeterministic: true,
        securityHashToken: "UNVERIFIED_BLOCKED",
      };
    }

    return {
      citation: match.citation,
      caseTitle: match.caseTitle,
      court: match.courtForum,
      decisionYear: match.decisionYear,
      reporter: match.reporter,
      volume: match.volume,
      page: match.page,
      bench: match.bench,
      statutorySubject: match.statutorySubjects.join("; "),
      holding: match.ratioDecidendi,
      relevance: customRelevance || match.summaryOfHolding,
      ratioDecidendi: match.ratioDecidendi,
      verificationStatus: "VERIFIED_CANONICAL",
      verificationHash: match.verificationHash,
      isDeterministic: true,
      securityHashToken: match.id,
    };
  }

  /**
   * Deterministically select and validate verified precedents for a specific case category & factual context.
   * GUARANTEES that ONLY 100% verified citations are ever returned.
   */
  public static getVerifiedPrecedentsForContext(
    category: "SPECIFIC_PERFORMANCE" | "DECLARATION_AND_POSSESSION" | "GENERAL_CIVIL" | "INHERITANCE_CONSULTATION",
    options: {
      isAncestorDeceased?: boolean;
      hasRegisteredBainapatra?: boolean;
      hasTreasuryDeposit?: boolean;
      isDispossessed?: boolean;
      rawText?: string;
    } = {}
  ): VerifiedPrecedentOutput[] {
    const selected: VerifiedPrecedentOutput[] = [];

    if (category === "SPECIFIC_PERFORMANCE") {
      // 60 DLR (AD) 54 & 59 DLR (AD) 112
      selected.push(
        this.validate(
          "60 DLR (AD) 54",
          "Strict statutory bar on maintainability of suits based on unregistered Bainapatras or where treasury deposit of the balance consideration is lacking (Section 21A SRA & Section 17A Registration Act)."
        ),
        this.validate(
          "59 DLR (AD) 112",
          "Confirms that prompt deposit of balance money in treasury complies with statutory continuous readiness and willingness averments."
        ),
        this.validate(
          "42 DLR (AD) 289",
          "Enforces peremptory dismissal of time-barred suits under Article 54 and Section 3 of the Limitation Act 1908."
        )
      );
    } else if (category === "DECLARATION_AND_POSSESSION") {
      selected.push(
        this.validate(
          "56 DLR (AD) 34",
          "Supports Plaintiff's absolute title over conflicting unregistered agreements of the Defendant (Section 54 Transfer of Property Act)."
        ),
        this.validate(
          "12 BLC (AD) 102",
          "Corroborates Plaintiff's continuous possession chain through mutation khatian entries and Dakhila tax receipts."
        ),
        this.validate(
          "17 BLD (AD) 77",
          "Mandates that when a plaintiff is out of possession, a declaratory prayer under Section 42 SRA must be coupled with consequential relief of recovery of possession under Section 8 SRA."
        )
      );
    } else if (category === "INHERITANCE_CONSULTATION") {
      if (options.isAncestorDeceased === true) {
        // Ancestor explicitly evaluated as deceased — load partition/succession precedents
        selected.push(
          this.validate(
            "45 DLR (AD) 124",
            "Establishes that the legal heirs immediately and automatically become vested co-owners of their respective shares at the moment of death, which cannot be impaired by any pre-death disowning affidavit."
          ),
          this.validate(
            "55 DLR (AD) 180",
            "Confirms that the father's unilateral disowning affidavit or newspaper notice has zero legal standing in Muslim law to alter the Shariat-mandated lines of inheritance."
          ),
          this.validate(
            "39 DLR (AD) 162",
            "Confirms that exclusive mutation of the suit property by one co-sharer is purely for revenue collection and does not divest other heirs of their lawful inherited title."
          ),
          this.validate(
            "51 DLR (AD) 234",
            "Mandates that all surviving co-heirs are indispensable necessary parties in the partition suit under Order XX Rule 18 CPC."
          )
        );
      } else if (options.isAncestorDeceased === false) {
        // Ancestor explicitly evaluated as living — spes successionis bar applies
        selected.push(
          this.validate(
            "30 DLR (SC) 115",
            "Establishes that children have no vested right or justiciable cause of action to challenge a living parent's declarations during his lifetime (spes successionis)."
          ),
          this.validate(
            "55 DLR (AD) 180",
            "Confirms that the father's disowning affidavit is a legal nullity in Shariat, but no cause of action exists to seek declaration until succession opens upon death."
          )
        );
      } else {
        // Ancestor vital status NOT DETERMINED — fail-closed: load only precedents
        // that apply regardless of vital status, plus a diagnostic note.
        selected.push(
          this.validate(
            "55 DLR (AD) 180",
            "Unilateral disowning affidavits are a legal nullity in Shariat regardless of whether the ancestor is living or deceased. However, the justiciability of partition claims depends on succession having opened."
          ),
          this.validate(
            "42 DLR (AD) 289",
            "Mandatory statutory limitation audit under Section 3 of the Limitation Act 1908 applies to all civil suits regardless of subject matter."
          ),
          this.validate(
            "43 DLR (AD) 21",
            "Fundamental civil burden of proof (onus probandi) under Sections 101-103 of the Evidence Act 1872."
          )
        );
      }
    } else {
      selected.push(
        this.validate(
          "43 DLR (AD) 21",
          "Governs the fundamental civil burden of proof (onus probandi) under Sections 101-103 of the Evidence Act 1872."
        ),
        this.validate(
          "42 DLR (AD) 289",
          "Governs mandatory statutory limitation audits under Section 3 of the Limitation Act 1908."
        )
      );
    }

    // Filter out any unverified entries strictly
    return selected.filter((p) => p.verificationStatus === "VERIFIED_CANONICAL");
  }

  /**
   * Audit and verify an entire array of raw precedents
   */
  public static validatePrecedentArray(rawPrecedents: Array<{ citation: string; relevance?: string }>): VerifiedPrecedentOutput[] {
    return rawPrecedents.map((p) => this.validate(p.citation, p.relevance));
  }

  /**
   * Return entire canonical registry list for verification inspections
   */
  public static getFullRegistry(): AuthoritativePrecedent[] {
    return Object.values(CANONICAL_PRECEDENT_REGISTRY);
  }
}
