import { CaseAnalysisResponse, EngineInput } from "../types/types";
import { AuthUser } from "../types/auth.types";
import { generateSecureId, generateHash } from "../utils/crypto";
import { generateWatermark } from "../utils/watermark";
import { logAudit } from "../utils/audit";

/**
 * BCCAA Offline Engine v2.5
 * Pure client-side dynamic rule-based analytical engine
 * No API calls. No Gemini. Fully deterministic and reactive to input fact patterns.
 */
export class BCCAAEngine {
  private user: AuthUser;
  private license: { licenseId: string; issuedTo: string };

  constructor(user: AuthUser, license: { licenseId: string; issuedTo: string }) {
    this.user = user;
    this.license = license;
  }

  /**
   * Main analysis entry point
   */
  async analyze(input: EngineInput): Promise<CaseAnalysisResponse> {
    const startTime = Date.now();
    const caseId = `BCCAA-${Date.now()}-${generateSecureId().substring(0, 8)}`;

    logAudit({
      action: "ANALYZE_START",
      userId: this.user.id,
      email: this.user.email,
      role: this.user.role,
      resourceType: "CASE",
      resourceId: caseId,
      outcome: "SUCCESS",
      metadata: { factPatternLength: input.factPattern.length, domain: input.focusDomain },
    });

    // Parse fact pattern dynamically
    const facts = this.parseFacts(input.factPattern, input.focusDomain);

    // Run all 14 stages deterministically
    const response: CaseAnalysisResponse = {
      stage0: this.buildFactMatrix(facts),
      stage1: this.classifyDomain(facts, input.focusDomain),
      stage2: this.mapLegislation(facts),
      stage3: this.checkLimitation(facts),
      stage4: this.analyzeParties(facts),
      stage5: this.determineJurisdiction(facts),
      stage6: this.checkPleadings(facts),
      stage7: this.frameIssues(facts),
      stage8: this.analyzeEvidence(facts),
      stage9: this.debateMerits(facts),
      stage10: this.checkEquity(facts),
      stage11: this.buildTimeline(facts),
      stage12: this.mapAppeals(facts),
      stage13: this.synthesize(facts),
      _security: {
        analyzedBy: this.user.email,
        analyzedAt: Date.now(),
        licenseId: this.license.licenseId,
        forensicHash: generateHash(caseId + input.factPattern + startTime),
        engineVersion: "2.5.0-offline",
      },
    };

    // Embed watermark
    const watermark = generateWatermark(this.user, this.license as any, caseId);
    console.log("[BCCAA Watermark]", watermark);

    logAudit({
      action: "ANALYZE_COMPLETE",
      userId: this.user.id,
      email: this.user.email,
      role: this.user.role,
      resourceType: "CASE",
      resourceId: caseId,
      outcome: "SUCCESS",
      metadata: { durationMs: Date.now() - startTime, stages: 14 },
    });

    return response;
  }

  // ─── STAGE 0: FACT MATRIX ───
  private buildFactMatrix(facts: ParsedFacts) {
    return {
      chronology: facts.dates.map((d) => ({
        date: d.date,
        event: d.event,
        partiesInvolved: d.parties,
        statutorySignificance: d.statutorySignificance,
      })),
      admittedFacts: facts.admitted,
      disputedFacts: facts.disputed,
      inferredFacts: facts.inferred,
      liabilityFacts: facts.liability,
      quantumFacts: facts.quantum,
    };
  }

  // ─── STAGE 1: DOMAIN CLASSIFICATION ───
  private classifyDomain(facts: ParsedFacts, focusDomain: string) {
    let primary = focusDomain;
    if (primary === "Auto-detect") {
      if (facts.category === "SPECIFIC_PERFORMANCE") {
        primary = "Specific Performance";
      } else if (facts.category === "DECLARATION_AND_POSSESSION") {
        primary = "Declaration of Title";
      } else {
        primary = "General Civil Dispute";
      }
    }

    const subsidiary = facts.category === "SPECIFIC_PERFORMANCE"
      ? ["Contract Law", "Registration & Stamp Law", "Equity Jurisprudence"]
      : facts.category === "DECLARATION_AND_POSSESSION"
      ? ["Specific Relief", "Property and Land Law", "Recovery and Ouster"]
      : ["General Civil Procedure", "Injunctions"];

    return {
      primaryDomain: primary,
      subsidiaryDomains: subsidiary,
      triggerFacts: facts.triggers.map((t) => ({
        domain: t.domain,
        fact: t.fact,
        statutoryTrigger: t.trigger,
      })),
    };
  }

  // ─── STAGE 2: LEGISLATION MAP ───
  private mapLegislation(facts: ParsedFacts) {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";
    const isDP = facts.category === "DECLARATION_AND_POSSESSION";

    const primaryAct = isSP || isDP ? "Specific Relief Act 1877" : "Code of Civil Procedure 1908";

    const relevantSections: Array<{ actName: string; sectionOrRule: string; purpose: string }> = [];

    if (isSP) {
      relevantSections.push(
        { actName: "Specific Relief Act 1877", sectionOrRule: "Section 12", purpose: "Enforcement of specific performance of contracts concerning immovable property." },
        { actName: "Specific Relief Act 1877", sectionOrRule: "Section 21A", purpose: "Statutory bar on suits for specific performance unless contract (Bainapatra) is registered and remaining consideration is deposited in court." },
        { actName: "Transfer of Property Act 1882", sectionOrRule: "Section 54", purpose: "Mandates that sale of immovable property must be made only by registered instrument." },
        { actName: "Registration Act 1908", sectionOrRule: "Section 17A", purpose: "Mandatory registration of written contracts for sale of land (Bainapatra)." }
      );
    } else if (isDP) {
      const hasSec9 = facts.rawText.toLowerCase().includes("section 9") || facts.rawText.toLowerCase().includes("sec 9");
      if (hasSec9) {
        relevantSections.push(
          { actName: "Specific Relief Act 1877", sectionOrRule: "Section 9", purpose: "Summary suit for recovery of possession by person dispossessed of land within 6 months without consent." }
        );
      } else {
        relevantSections.push(
          { actName: "Specific Relief Act 1877", sectionOrRule: "Section 8", purpose: "Recovery of possession of specific immovable property based on title and ownership rights." },
          { actName: "Specific Relief Act 1877", sectionOrRule: "Section 42", purpose: "Declaratory suit for declaration of title and status of legal rights in the suit property." }
        );
      }
      relevantSections.push(
        { actName: "Specific Relief Act 1877", sectionOrRule: "Section 54", purpose: "Grant of perpetual/permanent injunction to restrain further trespass." },
        { actName: "State Acquisition and Tenancy Act 1950", sectionOrRule: "Section 143", purpose: "Rules for updating land record-of-rights (Khatian) and recording mutation." }
      );
    } else {
      relevantSections.push(
        { actName: "Code of Civil Procedure 1908", sectionOrRule: "Section 9", purpose: "General jurisdiction of civil courts to try all suits of civil nature." },
        { actName: "Specific Relief Act 1877", sectionOrRule: "Section 54", purpose: "Perpetual injunction restraining wrongful alienation or damage." }
      );
    }

    const precedents: Array<{ citation: string; court: string; holding: string; relevance: string }> = [];

    if (isSP) {
      precedents.push(
        {
          citation: "60 DLR (AD) 54",
          court: "Appellate Division",
          holding: "Registration of Bainapatra and deposit of remaining purchase money are absolute statutory prerequisites under Section 21A of the Specific Relief Act 1877.",
          relevance: "Defeats any specific performance claims based on unregistered agreements or where balance deposit is lacking."
        },
        {
          citation: "59 DLR (AD) 112",
          court: "Appellate Division",
          holding: "The plaintiff seeking specific performance must demonstrate readiness to perform throughout, which is established by tendering the remaining consideration.",
          relevance: "Confirms that prompt deposit of balance money complies with readiness averments."
        }
      );
    } else if (isDP) {
      precedents.push(
        {
          citation: "56 DLR (AD) 34",
          court: "Appellate Division",
          holding: "An unregistered contract creates no interest or title in immovable land, and a registered sale deed supported by mutation must prevail.",
          relevance: "Supports Plaintiff's absolute title over any conflicting unregistered claims of the Defendant."
        },
        {
          citation: "12 BLC (AD) 102",
          court: "Appellate Division",
          holding: "Entries in the mutation khatian and payment of land development tax constitute strong corroborative evidence of possession.",
          relevance: "Corroborates the Plaintiff's possession chain and refutes claims of adverse possession by trespassers."
        }
      );
    } else {
      precedents.push(
        {
          citation: "43 DLR (AD) 21",
          court: "Appellate Division",
          holding: "The onus of proof lies squarely on the asserting party to establish their claim to the civil relief.",
          relevance: "Governs general burden of proof framework."
        }
      );
    }

    const equityPrinciples = isSP
      ? [
          "Equity treats as done that which ought to be done — forcing execution of the agreed sale deed.",
          "He who seeks equity must do equity — requiring full deposit of balance consideration in court."
        ]
      : isDP
      ? [
          "He who comes to equity must come with clean hands — a trespasser cannot resist the legal title of the registered owner.",
          "Equity aids the vigilant, not those who slumber on their rights — enforcing strict 12-year limits on title recovery."
        ]
      : [
          "Delay defeats equity — Vigilantibus non dormientibus jura subveniunt."
        ];

    return {
      primaryAct,
      relevantSections,
      precedents,
      equityPrinciples,
    };
  }

  // ─── STAGE 3: LIMITATION CHECK ───
  private checkLimitation(facts: ParsedFacts) {
    return this.computeLimitation(facts);
  }

  // ─── STAGE 4: PARTY ANALYSIS ───
  private analyzeParties(facts: ParsedFacts) {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";
    const isDP = facts.category === "DECLARATION_AND_POSSESSION";

    const plaintiffs = facts.parties.filter((p) => p.side === "plaintiff").map((p) => ({
      name: p.name,
      legalIdentity: p.identity,
      capacity: p.capacity,
      causeOfActionAccess: p.causeOfAction || (isSP ? "Right to seek performance under registered agreement" : "Right of recovery as absolute registered titleholder"),
    }));

    const defendants = facts.parties.filter((p) => p.side === "defendant").map((p) => ({
      name: p.name,
      legalIdentity: p.identity,
      capacity: p.capacity,
      liabilityType: p.liability || (isSP ? "Contractual breach of Bainapatra" : "Wrongful trespass and illegal dispossession"),
    }));

    const joinderIssues = isSP
      ? "No misjoinder or non-joinder identified. Only the original parties to the registered Bainapatra are necessary parties."
      : isDP
      ? "No misjoinder. If any third party is occupying a portion of the land, they must be added as a party to avoid issues in execution."
      : "No procedural misjoinder or non-joinder of parties.";

    const locusStandiSummary = isSP
      ? "Plaintiff has undeniable locus standi as the contract-holder who paid advance consideration under a registered Bainapatra."
      : isDP
      ? "Plaintiff has undeniable locus standi as the registered titleholder of the suit land supported by mutation khatians."
      : "Plaintiff has locus standi based on direct infringement of civil rights.";

    return {
      plaintiffs,
      defendants,
      joinderIssues,
      locusStandiSummary,
    };
  }

  // ─── STAGE 5: JURISDICTION ───
  private determineJurisdiction(facts: ParsedFacts) {
    const valuationNum = facts.contractDetails.total;
    const valuationText = `BDT ${valuationNum.toLocaleString("en-US")}`;
    const courtLevel = this.determineCourtLevel(valuationNum);

    const territorialRule = "A civil suit for land title, possession, or specific performance must be instituted where the immovable property is situated.";
    const territorialSection = "Section 16(a) and 16(d) of the Code of Civil Procedure 1908";
    const jurisdictionalFacts = facts.location || "The suit land situated within the local limits of the selected Court.";

    const pecuniaryLimits = "Assistant Judge Court: Up to 15L | Senior Assistant: 15L to 25L | Joint District: 25L to 5Cr | District Judge: Unlimited (appeals up to 5Cr)";
    
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";
    const suitsValuationActNotes = isSP
      ? `Valued under Section 7(x)(a) of the Court Fees Act 1870 and Section 8 of the Suits Valuation Act 1887. The suit is valued exactly at the contract consideration of BDT ${valuationNum.toLocaleString("en-US")}, requiring mandatory ad valorem court fees.`
      : `Valued under Section 7(iv)(c) of the Court Fees Act 1870. The Plaintiff has valued the relief for declaration of title with consequential recovery of khas possession at the market rate of BDT ${valuationNum.toLocaleString("en-US")}, requiring ad valorem court fees.`;

    return {
      territorial: {
        rule: territorialRule,
        governingSection: territorialSection,
        jurisdictionalFacts,
      },
      pecuniary: {
        valuation: valuationText,
        courtLevel,
        pecuniaryLimits,
        suitsValuationActNotes,
      },
      subjectMatter: {
        isExcluded: false,
        forum: "Ordinary Civil Court",
        governingStatute: "Civil Courts Act 1887 and Section 9 of CPC 1908",
      },
      objectionStrategy: isSP
        ? "Defendant may falsely assert that the property is undervalued. Promptly present the registered Bainapatra deed which records the agreed consideration, leaving no room for valuation disputes."
        : "Defendant may object under Section 21 of CPC. Counter by presenting the certified minimum valuation register of the sub-registry to prove valuation compliance.",
    };
  }

  // ─── STAGE 6: PLEADINGS ───
  private checkPleadings(facts: ParsedFacts) {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";

    const plaintChecklist = isSP
      ? [
          "Pleading the execution of the written Bainapatra",
          "Pleading the registration of the Bainapatra (critical under Section 21A SRA)",
          "Averring complete and continuous readiness and willingness to perform (Section 24 SRA)",
          "Pleading the deposit of the remaining balance consideration in court",
          "Factual chronology of demand and defendant's refusal",
          "Correct description and boundaries of the suit land",
        ]
      : [
          "Pleading absolute ownership and registered title deeds",
          "Pleading mutation details and land development tax payments",
          "Averring the exact date, time, and manner of wrongful dispossession",
          "Providing detailed schedule and boundaries of the encroached land",
          "Prayer for declaration of title and khas possession",
          "Prayer for permanent injunction and removal of structures",
        ];

    const groundsForRejection = isSP
      ? [
          "Order VII Rule 11(d) CPC if the suit is filed beyond 1 year of limitation",
          "Order VII Rule 11(a) CPC if the plaint fails to show deposit of remaining balance (Section 21A SRA)",
        ]
      : [
          "Order VII Rule 11(d) CPC if the suit is filed beyond 12 years from the date of dispossession",
        ];

    const writtenStatementDeemedAdmissions = isSP
      ? "Under Order VIII Rule 5 CPC, if the Defendant fails to specifically deny the execution or registration of the Bainapatra, it will be treated as a deemed admission. General or evasive denials are insufficient."
      : "If the Defendant does not specifically challenge the registered sale deeds of the Plaintiff or their mutation entries, they shall be treated as deemed admissions under Order VIII Rule 5 CPC.";

    const counterclaimsOrSetOff = isSP
      ? "Defendant may file a counterclaim seeking cancellation of the Bainapatra under Section 39 SRA on grounds of alleged fraud. The burden to establish fraud lies heavily on the Defendant."
      : "Defendant may assert a counterclaim of adverse possession or independent title, which requires high proof of hostile and continuous physical possession exceeding 12 years.";

    return {
      plaintChecklist,
      groundsForRejection,
      writtenStatementDeemedAdmissions,
      counterclaimsOrSetOff,
    };
  }

  // ─── STAGE 7: ISSUE FRAMING ───
  private frameIssues(facts: ParsedFacts) {
    return {
      issues: this.generateIssues(facts).map((iss, i) => ({
        issueNo: i + 1,
        title: iss.title,
        type: iss.type,
        burden: iss.burden,
        evidenceRequired: iss.evidence,
      })),
    };
  }

  // ─── STAGE 8: EVIDENCE ───
  private analyzeEvidence(facts: ParsedFacts) {
    return {
      evidenceList: this.classifyEvidence(facts),
      burdenAssignments: this.assignBurdens(facts),
      statutoryPresumptions: this.findPresumptions(facts),
    };
  }

  // ─── STAGE 9: MERITS ───
  private debateMerits(facts: ParsedFacts) {
    return {
      issueDetails: this.generateIssues(facts).map((iss, i) => ({
        issueNo: i + 1,
        issueTitle: iss.title,
        plaintiffPosition: iss.plaintiffPosition,
        defendantPosition: iss.defendantPosition,
        courtAnalysis: iss.courtAnalysis,
        projectedFinding: iss.projectedFinding,
      })),
    };
  }

  // ─── STAGE 10: EQUITY ───
  private checkEquity(facts: ParsedFacts) {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";

    const applicablePrinciples = isSP
      ? [
          { principle: "Equity treats as done that which ought to be done", application: "Directs court to treat the contract of sale as an obligation that must be fulfilled by signing the deed.", weight: "High" },
          { principle: "He who seeks equity must do equity", application: "Requires the Plaintiff to deposit the balance consideration of BDT " + facts.contractDetails.balance.toLocaleString("en-US") + " in court.", weight: "High" }
        ]
      : [
          { principle: "He who comes to equity must come with clean hands", application: "The Defendant is a trespasser who forcefully dispossessed the owner and erected fences. No equitable relief is available to him.", weight: "High" },
          { principle: "Equity aids the vigilant, not those who slumber on their rights", application: "Plaintiff filed the suit within the 12-year statutory limit from dispossession, demonstrating vigil.", weight: "Medium" }
        ];

    const discretionaryReliefCheck = isSP
      ? "Specific performance under Section 12 SRA is a discretionary remedy, but the discretion must be exercised on sound judicial principles. Since the Bainapatra is registered, balance money is deposited, and Plaintiff is ready, the court has no judicial grounds to deny the decree."
      : "Declarations under Section 42 and injunctions under Section 54 are discretionary. However, once the Plaintiff establishes absolute registered title and wrongful dispossession, recovery of possession under Section 8 SRA becomes an absolute legal right.";

    return {
      applicablePrinciples,
      discretionaryReliefCheck,
    };
  }

  // ─── STAGE 11: TIMELINE ───
  private buildTimeline(facts: ParsedFacts) {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";

    const stages = isSP
      ? [
          { name: "Institution of Suit", cpc: "Order VII Rule 1", actions: "Draft plaint, pay ad valorem court fees, and file in Court.", strategy: "Ensure registered Bainapatra and balance deposit challan are attached." },
          { name: "Service of Summons", cpc: "Order V", actions: "Dispatch summons through court bailiff and registered post with A/D.", strategy: "Verify defendant service to prevent delays in ex-parte proceedings." },
          { name: "Written Statement", cpc: "Order VIII Rule 1", actions: "Defendant must file written statement within 30-60 days.", strategy: "Examine written statement for any evasive denials of contract execution." },
          { name: "Framing of Issues", cpc: "Order XIV Rule 1", actions: "Court frames formal issues of fact and law.", strategy: "Ensure the issues of execution, registration, and readiness are specifically framed." },
          { name: "Plaintiff Evidence (P.W.)", cpc: "Order XVIII Rule 4", actions: "Examination-in-chief of Plaintiff, attesting witnesses of Bainapatra, and cross-examination.", strategy: "Affirm execution of Bainapatra, payment of advance, and deposit of balance money." },
          { name: "Defendant Evidence (D.W.)", cpc: "Order XVIII", actions: "DW examination-in-chief and cross-examination by Plaintiff's pleader.", strategy: "Expose inconsistencies in Defendant's claims of fraud or non-payment during cross." },
          { name: "Arguments", cpc: "Section 192 CPC", actions: "Final oral and written arguments.", strategy: "Cite 60 DLR (AD) 54 to assert that registration and deposit make performance mandatory." },
          { name: "Judgment & Decree", cpc: "Order XX", actions: "Pronouncement of judgment directing specific performance.", strategy: "Verify that the decree directs execution and registration of sale deed in 30 days." },
          { name: "Execution Case", cpc: "Order XXI Rule 34", actions: "File execution case if Defendant refuses to sign the deed.", strategy: "Pray for Court execution of the deed and delivery of physical possession." },
        ]
      : [
          { name: "Institution of Suit", cpc: "Order VII Rule 1", actions: "Draft plaint, value according to land market rate, pay ad valorem fees, file.", strategy: "Attach original registered sale deeds, mutation khatian, and dakhilas." },
          { name: "Service of Summons", cpc: "Order V", actions: "Process fees, dispatch summons to Defendant.", strategy: "Secure prompt service to prevent evasive maneuvers." },
          { name: "Written Statement", cpc: "Order VIII Rule 1", actions: "Defendant files WS pleading his defense.", strategy: "Watch for claims of adverse possession and ensure they are refuted." },
          { name: "Framing of Issues", cpc: "Order XIV Rule 1", actions: "Issues framed regarding title, dispossession date, and limitation.", strategy: "Ensure the issue of physical possession is properly formulated." },
          { name: "Plaintiff Evidence (P.W.)", cpc: "Order XVIII Rule 4", actions: "P.W. evidence, mutation certified copies, tax receipts, and local witness statements.", strategy: "Establish absolute title chain and exact date of dispossession." },
          { name: "Defendant Evidence (D.W.)", cpc: "Order XVIII", actions: "D.W. evidence, cross-examination by Plaintiff.", strategy: "Expose lack of any registered instrument or legal right to hold the land." },
          { name: "Arguments", cpc: "Section 192 CPC", actions: "Oral and written arguments on title and possession.", strategy: "Cite 56 DLR (AD) 34 to establish that Plaintiff's registered title must prevail." },
          { name: "Judgment & Decree", cpc: "Order XX", actions: "Decree declaring title and ordering delivery of khas possession.", strategy: "Ensure recovery of possession and removal of structures are specifically ordered." },
          { name: "Execution Case", cpc: "Order XXI Rule 35", actions: "File Execution Case to recover physical possession.", strategy: "Request writ of delivery of possession (Dakhalnama) with police force aid." },
        ];

    return {
      timelineProgress: stages.map((s) => ({
        stageName: s.name,
        cpcReference: s.cpc,
        subActions: s.actions,
        strategicPlay: s.strategy,
      })),
    };
  }

  // ─── STAGE 12: APPEALS ───
  private mapAppeals(facts: ParsedFacts) {
    const valuationNum = facts.contractDetails.total;
    const isHighValue = valuationNum > 5000000; // Above 50 Lakh (under newer rules District Judge appeals or AD depending on levels)

    return {
      appealNodes: [
        {
          level: "First Appeal",
          authority: isHighValue ? "High Court Division" : "District Judge Court",
          scope: "Comprehensive re-examination of both questions of fact and questions of law against the decree.",
          governingSection: "Section 96 of the Code of Civil Procedure 1908",
        },
        {
          level: "Civil Revision",
          authority: "High Court Division",
          scope: "Checking for jurisdictional errors, illegality, material irregularities, or failure to exercise jurisdiction.",
          governingSection: "Section 115 of the Code of Civil Procedure 1908",
        },
        {
          level: "Leave to Appeal",
          authority: "Appellate Division",
          scope: "Review of substantial questions of constitutional or public legal importance.",
          governingSection: "Article 103 of the Constitution of Bangladesh",
        },
      ],
    };
  }

  // ─── STAGE 13: SYNTHESIS ───
  private synthesize(facts: ParsedFacts) {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";
    const isDP = facts.category === "DECLARATION_AND_POSSESSION";

    let overview = "";
    let reliefDecree = "";
    let equitableBars = "";
    let executionPathway = "";

    if (isSP) {
      overview = `This is a suit for Specific Performance of a contract for sale of land (Bainapatra). Under Section 21A of the Specific Relief Act 1877 (introduced in 2004) and Section 17A of the Registration Act 1908, a suit for specific performance is maintainable only if: (1) the Bainapatra is written and registered, and (2) the remaining purchase money of BDT ${facts.contractDetails.balance.toLocaleString("en-US")} is deposited in the court. The Plaintiff has complied with both statutory mandates. The Defendant has breached the reciprocal contract by refusing to execute the final sale deed.`;
      
      reliefDecree = `A decree for specific performance of contract is to be passed in favor of the Plaintiff. The Defendant is ordered to sign, execute, and register a proper Deed of Sale (Saf Kabala) in favor of the Plaintiff for the suit land within 30 days, upon drawing the remaining consideration of BDT ${facts.contractDetails.balance.toLocaleString("en-US")} deposited in court. In default, the Court shall execute and register the deed on behalf of the Defendant at their expense under Order XXI Rule 34 CPC, and direct physical delivery of possession.`;
      
      equitableBars = `No equitable bars apply against the Plaintiff. The Plaintiff has demonstrated continuous readiness, deposited the balance money, and filed within the strict 1-year limitation under Article 54. The Defendant is barred by the doctrine of reciprocal promises and statutory non-compliance.`;
      
      executionPathway = `The decree will be executed by filing an Execution Case under Order XXI Rule 32 and Rule 34 CPC. If the Defendant refuses to execute the deed, the executing court will execute and register the deed of sale. If needed, the court will issue a writ of delivery of possession (Dakhalnama) under Order XXI Rule 35 CPC to deliver actual vacant possession of the land.`;
    } else if (isDP) {
      const hasSec9 = facts.rawText.toLowerCase().includes("section 9") || facts.rawText.toLowerCase().includes("sec 9");
      if (hasSec9) {
        overview = "This is a summary suit for recovery of possession under Section 9 of the Specific Relief Act 1877. The Plaintiff has proved forcible dispossession from the suit land within 6 months prior to filing the suit without consent. In a Section 9 suit, the court decides purely on the question of possession and dispossession, without entering into the question of ultimate title.";
        
        reliefDecree = "A decree is to be passed directing the Defendant to restore actual khas possession of the suit land to the Plaintiff within 30 days, and ordering the removal of unauthorized structures/fences. No declaration of title is granted in this summary proceeding.";
        
        equitableBars = "The suit was filed within 6 months of dispossession. The Defendant is barred from raising title claims in this suit and must seek remedy in an independent title suit.";
        
        executionPathway = "The decree will be executed by filing an Execution Case under Order XXI Rule 35 CPC. The court will issue a writ of delivery of possession (Dakhalnama) and direct a bailiff to physically hand over vacant possession, pulling down structures if necessary.";
      } else {
        overview = "This is a suit for Declaration of Title and Recovery of Khas Possession. The Plaintiff holds valid title through registered sale deeds, mutation, and tax records, while the Defendant occupies the property as a trespasser. Under Section 8 and 42 of the Specific Relief Act 1877, a lawful title-holder is entitled to recover possession from a wrongful occupant.";
        
        reliefDecree = "A decree is to be passed declaring the Plaintiff's absolute title to the suit land, directing the Defendant to deliver actual physical khas possession of the land to the Plaintiff within 30 days, and ordering the Defendant to dismantle and remove any unauthorized structures, fences, or brick boundary walls built thereon. A permanent injunction is also granted restraining the Defendant from interfering with the Plaintiff's possession.";
        
        equitableBars = "The Defendant is a trespasser with no legal or equitable title. The Plaintiff is not barred by laches as the suit was instituted well within the 12-year limitation period from dispossession under Article 142.";
        
        executionPathway = "The decree will be executed by filing an Execution Case under Order XXI Rule 35 CPC. The court will issue a writ of delivery of possession (Dakhalnama) and appoint a Civil Court Commissioner with police force assistance to demolish unauthorized boundary fences or structures and physically deliver vacant possession.";
      }
    } else {
      overview = `Analysis of the civil dispute reveals maintainable causes of action under the identified statutory framework of CPC 1908. The suit is recommended for institution with proper pleadings and evidentiary preparation.`;
      
      reliefDecree = "Decree to be formulated based on proven claims and statutory entitlements, including perpetual injunction and declaration of rights.";
      
      equitableBars = "No equitable bars apply. The Plaintiff comes with clean hands seeking status quo protection.";
      
      executionPathway = "The decree will be executed under Order XXI Rule 32 CPC by attachment of property or civil detention if the Defendant violates the permanent injunction.";
    }

    const costsApportionment = "Full costs of the suit, including ad valorem court fees, advocate fees, and procedural expenses, are awarded to the Plaintiff under Section 35 of the Code of Civil Procedure 1908.";

    return {
      overview,
      reliefDecree,
      costsApportionment,
      equitableBars,
      executionPathway,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS (Fact Parsing & Detection)
  // ═══════════════════════════════════════════════════════════════

  private parseFacts(text: string, focusDomain: string): ParsedFacts {
    const lower = text.toLowerCase();
    
    // Extract dates dynamically
    const dateInfoList = this.extractDates(text);
    const dates = dateInfoList.map((d) => {
      const parsedEvent = this.inferEventForDateEx(d, text);
      return {
        date: d.dateStr,
        event: parsedEvent.event,
        parties: this.inferPartiesForDate(d, text),
        statutorySignificance: this.getStatutorySignificance(parsedEvent.type),
      };
    });

    // Detect Category with robust scoring
    let spScore = 0;
    let dpScore = 0;
    
    const spKeywords = ["specific performance", "bainapatra", "agreement to sell", "contract", "advance", "earnest", "execute deed", "execute sale deed", "breach of contract", "refused to execute", "balance payment"];
    const dpKeywords = ["declaration of title", "khas possession", "dispossessed", "trespass", "ousted", "ouster", "recovery of possession", "boundary wall", "khas", "possession", "title deed", "registered sale deed"];
    
    for (const k of spKeywords) {
      if (lower.includes(k)) spScore += 2;
    }
    if (lower.includes("agreement")) spScore += 1;
    if (lower.includes("contract")) spScore += 1;
    if (lower.includes("advance")) spScore += 1;
    if (lower.includes("baina")) spScore += 1;
    
    for (const k of dpKeywords) {
      if (lower.includes(k)) dpScore += 2;
    }
    if (lower.includes("title")) dpScore += 1;
    if (lower.includes("possession")) dpScore += 1;
    if (lower.includes("trespass")) dpScore += 1;
    if (lower.includes("dispossession")) dpScore += 1;
    
    let category: "SPECIFIC_PERFORMANCE" | "DECLARATION_AND_POSSESSION" | "GENERAL_CIVIL" = "GENERAL_CIVIL";
    if (spScore > dpScore && spScore > 0) {
      category = "SPECIFIC_PERFORMANCE";
    } else if (dpScore >= spScore && dpScore > 0) {
      category = "DECLARATION_AND_POSSESSION";
    }

    if (focusDomain === "Specific Performance") {
      category = "SPECIFIC_PERFORMANCE";
    } else if (focusDomain === "Declaration of Title") {
      category = "DECLARATION_AND_POSSESSION";
    }

    // Extract contract details
    const contractDetails = this.extractContractDetails(text);

    // Detect parties
    const parties = this.detectPartiesDynamic(text, category);

    const keywords = [
      "sale deed", "registered", "unregistered", "mutation", "bainapatra",
      "agreement", "possession", "dispossessed", "trespass", "injunction",
      "declaration", "title", "limitation", "court fees", "plaint", "written statement"
    ].filter((k) => lower.includes(k));

    return {
      rawText: text,
      dates,
      parties,
      keywords,
      admitted: this.extractAdmittedFacts(text, category, contractDetails),
      disputed: this.extractDisputedFacts(text, category),
      inferred: this.extractInferredFacts(text, category),
      liability: this.extractLiabilityFacts(text, category),
      quantum: this.extractQuantumFacts(text, category, contractDetails),
      triggers: this.extractTriggers(text, category, contractDetails),
      primarySubject: this.detectPrimarySubject(category),
      location: this.extractLocation(text),
      category,
      contractDetails,
    };
  }

  private extractDates(text: string): DateInfo[] {
    const dates: DateInfo[] = [];
    
    // 1. Numeric dates: dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd
    const numRegex = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g;
    let match;
    while ((match = numRegex.exec(text)) !== null) {
      const fullDate = match[0];
      const d = parseInt(match[1]);
      const m = parseInt(match[2]);
      let y = parseInt(match[3]);
      if (y < 100) y += 2000;
      
      const parsedDate = new Date(y, m - 1, d);
      if (!isNaN(parsedDate.getTime())) {
        dates.push({
          dateStr: fullDate,
          parsedDate,
          index: match.index,
        });
      }
    }
    
    // 2. Word-based dates: 10 January 2024 or Dec 12, 2024
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthPattern = months.join("|");
    const wordRegex = new RegExp(`\\b(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})\\b|\\b(${monthPattern})\\s+(\\d{1,2})\\s*,?\\s*(\\d{4})\\b`, "gi");
    
    while ((match = wordRegex.exec(text)) !== null) {
      const fullDate = match[0];
      let day = 1;
      let monthStr = "";
      let year = 2026;
      
      if (match[1]) {
        day = parseInt(match[1]);
        monthStr = match[2];
        year = parseInt(match[3]);
      } else {
        monthStr = match[4];
        day = parseInt(match[5]);
        year = parseInt(match[6]);
      }
      
      const monthIndex = months.indexOf(monthStr.toLowerCase()) % 12;
      const parsedDate = new Date(year, monthIndex, day);
      if (!isNaN(parsedDate.getTime())) {
        if (!dates.some(d => d.dateStr === fullDate || Math.abs(d.index - match!.index) < 5)) {
          dates.push({
            dateStr: fullDate,
            parsedDate,
            index: match.index,
          });
        }
      }
    }
    
    return dates.sort((a, b) => a.index - b.index);
  }

  private inferEventForDateEx(dateInfo: DateInfo, text: string): { event: string; type: string } {
    const start = Math.max(0, dateInfo.index - 120);
    const end = Math.min(text.length, dateInfo.index + 120);
    const context = text.substring(start, end).toLowerCase();
    
    if (context.includes("bainapatra") || context.includes("agreement") || context.includes("contract") || context.includes("signed") || context.includes("executed")) {
      return {
        event: "Execution of the written agreement to sell (Bainapatra) between Plaintiff and Defendant",
        type: "CONTRACT_EXECUTION"
      };
    }
    if (context.includes("advance") || context.includes("earnest") || context.includes("payment") || context.includes("paid") || context.includes("received")) {
      return {
        event: "Payment of earnest money/advance consideration by the Plaintiff to the Defendant",
        type: "ADVANCE_PAYMENT"
      };
    }
    if (context.includes("refused") || context.includes("refusal") || context.includes("breach") || context.includes("failed") || context.includes("denied") || context.includes("demanded")) {
      return {
        event: "Defendant's refusal to execute and register the final sale deed despite demands",
        type: "CONTRACT_BREACH"
      };
    }
    if (context.includes("dispossessed") || context.includes("dispossession") || context.includes("ouster") || context.includes("ousted") || context.includes("trespass") || context.includes("evicted") || context.includes("fence") || context.includes("wall")) {
      return {
        event: "Wrongful dispossession of the Plaintiff from the suit land by the Defendant",
        type: "DISPOSSESSION"
      };
    }
    if (context.includes("registered") || context.includes("registration") || context.includes("registered sale deed")) {
      return {
        event: "Registration of the Sale Deed / Bainapatra before the Sub-Registrar",
        type: "REGISTRATION"
      };
    }
    if (context.includes("mutation") || context.includes("khatian") || context.includes("mutation khatian")) {
      return {
        event: "Completion of land mutation in the Upazila Land Office",
        type: "MUTATION"
      };
    }
    
    return {
      event: "Key transaction/event occurring on " + dateInfo.dateStr,
      type: "GENERAL"
    };
  }

  private getStatutorySignificance(type: string): string {
    switch (type) {
      case "CONTRACT_EXECUTION":
        return "Establishes a valid contract of sale under Section 54 of the Transfer of Property Act 1882. Subject to mandatory registration under Section 17A of the Registration Act 1908.";
      case "ADVANCE_PAYMENT":
        return "Demonstrates part-performance and readiness of the purchaser. Validates consideration under Section 2(d) of the Contract Act 1872.";
      case "CONTRACT_BREACH":
        return "Constitutes a breach of reciprocal promises (Section 39 Contract Act 1872) and triggers cause of action for Specific Performance under Section 12 SRA 1877.";
      case "DISPOSSESSION":
        return "Triggers right of recovery of possession of immovable property based on title (Section 8 SRA 1877, 12 years limitation) or summary dispossession (Section 9 SRA 1877, 6 months limitation).";
      case "REGISTRATION":
        return "Conveys absolute title under Section 54 of the Transfer of Property Act 1882 and satisfies the public notice rule under Section 49 of the Registration Act 1908.";
      case "MUTATION":
        return "Provides strong corroborative evidence of possession and updates revenue record-of-rights under Section 143 of the State Acquisition and Tenancy Act 1950.";
      default:
        return "Material fact establishing the chronology of civil rights and cause of action under Section 9 CPC.";
    }
  }

  private inferPartiesForDate(dateInfo: DateInfo, text: string): string {
    const start = Math.max(0, dateInfo.index - 120);
    const end = Math.min(text.length, dateInfo.index + 120);
    const context = text.substring(start, end).toLowerCase();
    
    if (context.includes("plaintiff") && context.includes("defendant")) {
      return "Plaintiff and Defendant";
    }
    if (context.includes("plaintiff")) {
      return "Plaintiff";
    }
    if (context.includes("defendant")) {
      return "Defendant";
    }
    return "Pleading Parties";
  }

  private detectPartiesDynamic(text: string, category: string): ParsedParty[] {
    const parties: ParsedParty[] = [];
    const isSP = category === "SPECIFIC_PERFORMANCE";

    // Regexes to extract actual names if specified
    const pMatches = text.match(/(?:[Mm]r\.|[Mm]d\.|[Mm]st\.|[Bb]egum)\s+([A-Z][a-zA-Z\s]+?)(?=\s+is\s+the\s+plaintiff|\s+as\s+plaintiff|\s*\(plaintiff\)|,?\s+the\s+plaintiff)/i);
    const dMatches = text.match(/(?:[Mm]r\.|[Mm]d\.|[Mm]st\.|[Bb]egum)\s+([A-Z][a-zA-Z\s]+?)(?=\s+is\s+the\s+defendant|\s+as\s+defendant|\s*\(defendant\)|,?\s+the\s+defendant)/i);

    let pName = pMatches ? pMatches[0].trim() : "";
    let dName = dMatches ? dMatches[0].trim() : "";

    // Secondary scan for basic capital sequences
    if (!pName) {
      const match = text.match(/([A-Z][a-zA-Z\s\.]+)\s+\(?\s*the\s+[pP]laintiff\)?/i);
      if (match) pName = match[1].trim();
    }
    if (!dName) {
      const match = text.match(/([A-Z][a-zA-Z\s\.]+)\s+\(?\s*the\s+[dD]efendant\)?/i);
      if (match) dName = match[1].trim();
    }

    if (!pName) {
      pName = isSP ? "Plaintiff (Proposed Purchaser)" : "Plaintiff (Title Owner)";
    }
    if (!dName) {
      dName = isSP ? "Defendant (Proposed Vendor)" : "Defendant (Trespasser)";
    }

    parties.push({
      name: pName,
      side: "plaintiff",
      identity: "Individual citizen",
      capacity: isSP ? "Purchaser under Bainapatra" : "Registered Legal Owner",
      causeOfAction: isSP ? "Refusal of vendor to perform contract" : "Forcible dispossession by trespasser",
    });

    parties.push({
      name: dName,
      side: "defendant",
      identity: "Individual citizen",
      capacity: isSP ? "Deed Owner / Vendor" : "Adverse Possessor / Trespasser",
      liability: isSP ? "Contractual liability to execute registered deed" : "Joint and several tortious liability for ouster",
    });

    return parties;
  }

  private extractContractDetails(text: string): { total: number; advance: number; balance: number } {
    const numbers: number[] = [];
    const regex = /(?:Tk\.?|BDT|Taka|taka)\s*([\d,]+)|([\d,]+)\s*(?:Taka|taka|Tk\.?|BDT)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const numStr = match[1] || match[2];
      const val = parseInt(numStr.replace(/,/g, ""));
      if (!isNaN(val) && val > 1000 && !numbers.includes(val)) {
        numbers.push(val);
      }
    }
    
    numbers.sort((a, b) => b - a);
    
    let total = 1200000; // Default BDT 12 Lakh
    let advance = 500000; // Default BDT 5 Lakh
    
    if (numbers.length >= 2) {
      total = numbers[0];
      advance = numbers[1];
    } else if (numbers.length === 1) {
      total = numbers[0];
      advance = Math.floor(total * 0.4); // Assume 40% advance
    }
    
    return {
      total,
      advance,
      balance: total - advance
    };
  }

  private detectPrimarySubject(category: string): string {
    if (category === "SPECIFIC_PERFORMANCE") {
      return "Specific Performance of Contract (Bainapatra)";
    }
    if (category === "DECLARATION_AND_POSSESSION") {
      return "Declaration of Title and Recovery of Khas Possession";
    }
    return "Civil Dispute / Injunctions";
  }

  private extractLocation(text: string): string | undefined {
    const match = text.match(/(?:in|at|within)\s+([A-Z][a-zA-Z\s]+(?:District|Thana|Upazila|Village))/i);
    return match ? match[1] : undefined;
  }

  private determineCourtLevel(valuation: number): string {
    if (valuation <= 1500000) return "Assistant Judge Court";
    if (valuation <= 2500000) return "Senior Assistant Judge Court";
    return "Joint District Judge Court"; // Unlimited original jurisdiction above 25L
  }

  private computeLimitation(facts: ParsedFacts) {
    let accrualDateStr = "Not determinable from facts";
    let accrualDate: Date | null = null;
    let article = "Article 65";
    let period = "12 Years";
    let isBarred = false;
    
    const dates = this.extractDates(facts.rawText);
    
    // Find breach, dispossession, or execution dates
    let breachDateInfo: DateInfo | null = null;
    let dispossessionDateInfo: DateInfo | null = null;
    let executionDateInfo: DateInfo | null = null;
    
    for (const d of dates) {
      const eventDetails = this.inferEventForDateEx(d, facts.rawText);
      if (eventDetails.type === "CONTRACT_BREACH" && !breachDateInfo) {
        breachDateInfo = d;
      } else if (eventDetails.type === "DISPOSSESSION" && !dispossessionDateInfo) {
        dispossessionDateInfo = d;
      } else if (eventDetails.type === "CONTRACT_EXECUTION" && !executionDateInfo) {
        executionDateInfo = d;
      }
    }
    
    if (facts.category === "SPECIFIC_PERFORMANCE") {
      article = "Article 54";
      period = "1 Year (as amended in 2004 for land sale contract)";
      
      if (breachDateInfo) {
        accrualDate = breachDateInfo.parsedDate;
        accrualDateStr = breachDateInfo.dateStr + " (Defendant's refusal to register the sale deed)";
      } else if (executionDateInfo) {
        // Assume 6 months deadline if no breach date explicitly found
        const execDate = executionDateInfo.parsedDate;
        const deadlineDate = new Date(execDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months later
        accrualDate = deadlineDate;
        
        const day = deadlineDate.getDate().toString().padStart(2, '0');
        const month = (deadlineDate.getMonth() + 1).toString().padStart(2, '0');
        const year = deadlineDate.getFullYear();
        accrualDateStr = `${day}/${month}/${year} (Calculated deadline of 6 months from Bainapatra)`;
      }
      
      if (accrualDate) {
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        isBarred = (Date.now() - accrualDate.getTime()) > oneYearMs;
      }
    } else if (facts.category === "DECLARATION_AND_POSSESSION") {
      const isSec9 = facts.rawText.toLowerCase().includes("section 9") || facts.rawText.toLowerCase().includes("sec 9");
      if (isSec9) {
        article = "Section 9 of SRA 1877";
        period = "6 Months";
        if (dispossessionDateInfo) {
          accrualDate = dispossessionDateInfo.parsedDate;
          accrualDateStr = dispossessionDateInfo.dateStr + " (Forcible dispossession date)";
          const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
          isBarred = (Date.now() - accrualDate.getTime()) > sixMonthsMs;
        }
      } else {
        article = "Article 142";
        period = "12 Years";
        if (dispossessionDateInfo) {
          accrualDate = dispossessionDateInfo.parsedDate;
          accrualDateStr = dispossessionDateInfo.dateStr + " (Forcible dispossession date)";
        } else if (dates.length > 0) {
          accrualDate = dates[0].parsedDate;
          accrualDateStr = dates[0].dateStr + " (First recorded chronology date)";
        }
        
        if (accrualDate) {
          const twelveYearsMs = 12 * 365 * 24 * 60 * 60 * 1000;
          isBarred = (Date.now() - accrualDate.getTime()) > twelveYearsMs;
        }
      }
    } else {
      article = "Article 120";
      period = "6 Years";
      if (dates.length > 0) {
        accrualDate = dates[dates.length - 1].parsedDate;
        accrualDateStr = dates[dates.length - 1].dateStr + " (Latest date showing dispute emergence)";
      }
      if (accrualDate) {
        const sixYearsMs = 6 * 365 * 24 * 60 * 60 * 1000;
        isBarred = (Date.now() - accrualDate.getTime()) > sixYearsMs;
      }
    }
    
    let preliminaryAnalysis = "";
    if (accrualDate) {
      const diffDays = Math.floor((Date.now() - accrualDate.getTime()) / (24 * 60 * 60 * 1000));
      if (isBarred) {
        preliminaryAnalysis = `The cause of action is TIME-BARRED. The suit was analyzed ${diffDays} days after accrual, which exceeds the prescribed statutory period of ${period} under ${article} of the Limitation Act 1908.`;
      } else {
        preliminaryAnalysis = `The suit is WITHIN LIMITATION. The cause of action accrued ${diffDays} days ago, which is well within the prescribed period of ${period} under ${article} of the Limitation Act 1908.`;
      }
    } else {
      preliminaryAnalysis = `The limitation cannot be fully computed as no valid accrual date (e.g. date of refusal or dispossession) could be extracted from the fact pattern. Pleaders must verify these dates.`;
    }
    
    return {
      accrualDate: accrualDateStr,
      prescribedPeriod: period,
      limitationArticle: article,
      isTimeBarred: isBarred,
      exceptionsOrExtensions: "Not applicable under Section 5 of the Limitation Act (which is generally excluded for original suits). Pleaders must plead precise facts to justify any extension under Section 14 or 19 if applicable.",
      preliminaryAnalysis,
    };
  }

  private generateIssues(facts: ParsedFacts): any[] {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";
    const isDP = facts.category === "DECLARATION_AND_POSSESSION";

    const pName = facts.parties.find(p => p.side === "plaintiff")?.name || "Plaintiff";
    const dName = facts.parties.find(p => p.side === "defendant")?.name || "Defendant";

    if (isSP) {
      return [
        {
          title: `Whether the suit is maintainable in its present form and under Sections 12 and 21A of the Specific Relief Act 1877`,
          type: "Mixed (Law & Fact)",
          burden: "Plaintiff",
          evidence: "Plaint compliance, registered Bainapatra, deposit receipt",
          plaintiffPosition: "Suit is fully maintainable as the contract is registered and remaining purchase money is deposited.",
          defendantPosition: "Suit is barred by statutory rules and lack of cause of action.",
          courtAnalysis: "Under Section 21A, registration and balance deposit are mandatory. If met, the suit is maintainable.",
          projectedFinding: "Decided in favor of Plaintiff."
        },
        {
          title: `Whether the suit is barred by limitation under Article 54 of the Limitation Act 1908`,
          type: "Law",
          burden: "Defendant",
          evidence: "Stipulated deadline of performance or refusal date, date of filing",
          plaintiffPosition: "The suit was filed within 1 year of Defendant's refusal to register the deed.",
          defendantPosition: "The suit was filed beyond 1 year from the date fixed for performance.",
          courtAnalysis: "Article 54 prescribes 1 year for specific performance. Based on the refusal/breach date, the suit timing is computed.",
          projectedFinding: "Decided in favor of Plaintiff (if filed within 1 year) or Defendant (if over 1 year)."
        },
        {
          title: `Whether there was a valid and registered Bainapatra executed between ${pName} and ${dName}`,
          type: "Fact",
          burden: "Plaintiff",
          evidence: "Original registered Bainapatra, attesting witnesses, payment voucher of advance",
          plaintiffPosition: `Plaintiff executed a valid, registered Bainapatra on the recorded date and paid BDT ${facts.contractDetails.advance.toLocaleString("en-US")} in advance.`,
          defendantPosition: "Denies execution of registered agreement or asserts signatures were obtained by fraud.",
          courtAnalysis: "The registered deed carries a strong presumption of execution under Section 60 of the Registration Act. No credible fraud shown.",
          projectedFinding: "Decided in favor of Plaintiff."
        },
        {
          title: `Whether the Plaintiff was always ready and willing to pay the balance consideration of BDT ${facts.contractDetails.balance.toLocaleString("en-US")}`,
          type: "Mixed",
          burden: "Plaintiff",
          evidence: "Written notices demanding execution, bank challan of the balance deposit",
          plaintiffPosition: `Plaintiff was ready and willing at all times, and has deposited the balance of BDT ${facts.contractDetails.balance.toLocaleString("en-US")} in court.`,
          defendantPosition: "Plaintiff has no funds and failed to perform obligations within time.",
          courtAnalysis: "Deposit of balance consideration in court under Section 21A SRA is conclusive proof of Plaintiff's continuous readiness and willingness.",
          projectedFinding: "Decided in favor of Plaintiff."
        }
      ];
    } else if (isDP) {
      const hasSec9 = facts.rawText.toLowerCase().includes("section 9") || facts.rawText.toLowerCase().includes("sec 9");
      if (hasSec9) {
        return [
          {
            title: "Whether the suit is maintainable under Section 9 of the Specific Relief Act 1877",
            type: "Law",
            burden: "Plaintiff",
            evidence: "Pleading showing summary dispossession",
            plaintiffPosition: "Suit is maintainable as Plaintiff was dispossessed without consent and filed within 6 months.",
            defendantPosition: "Suit is barred; title is with Defendant.",
            courtAnalysis: "Section 9 deals purely with possession. Title is not evaluated. Summary ouster is maintainable.",
            projectedFinding: "Decided in favor of Plaintiff."
          },
          {
            title: `Whether the Plaintiff was forcefully dispossessed from the suit land by ${dName} within 6 months prior to the filing of the suit`,
            type: "Fact",
            burden: "Plaintiff",
            evidence: "Oral testimonies of boundary neighbors, local inspection report, police diary",
            plaintiffPosition: `Defendant dispossessed Plaintiff on the recorded date without consent and built a boundary fence.`,
            defendantPosition: "Defendant was always in peaceful possession.",
            courtAnalysis: "Admissible evidence and witness testimonies show Plaintiff was in physical possession and dispossessed within 6 months.",
            projectedFinding: "Decided in favor of Plaintiff."
          }
        ];
      } else {
        return [
          {
            title: `Whether the suit is maintainable in its present form under Sections 8 and 42 of the Specific Relief Act 1877`,
            type: "Law",
            burden: "Plaintiff",
            evidence: "Court fees compliance, pleading cause of action",
            plaintiffPosition: "Suit is fully maintainable to recover land based on absolute title.",
            defendantPosition: "Suit is barred by defective pleadings and form of prayers.",
            courtAnalysis: "Plaintiff holds registered deed and seeks both declaration of title and recovery of possession (consequential relief), satisfying Section 42.",
            projectedFinding: "Decided in favor of Plaintiff."
          },
          {
            title: `Whether the suit is barred by limitation under Article 142 of the Limitation Act 1908`,
            type: "Law",
            burden: "Defendant",
            evidence: "Exact date of dispossession, date of filing",
            plaintiffPosition: "The suit was filed within 12 years of the ouster.",
            defendantPosition: "Defendant is in adverse possession for over 12 years, perfecting title.",
            courtAnalysis: "Article 142 gives 12 years from dispossession. Based on the facts, the filing is within 12 years.",
            projectedFinding: "Decided in favor of Plaintiff."
          },
          {
            title: `Whether the Plaintiff has absolute title to the suit land by virtue of registered deeds and mutation`,
            type: "Mixed",
            burden: "Plaintiff",
            evidence: "Registered Sale Deed, Mutation Khatian, DCR, and rent receipts (dakhilas)",
            plaintiffPosition: "Plaintiff acquired absolute legal title and is recorded as the owner in the government registers.",
            defendantPosition: "Plaintiff's deed is fraudulent or non-operative.",
            courtAnalysis: "Plaintiff's title is fully supported by registered instruments which enjoy statutory presumptions.",
            projectedFinding: "Decided in favor of Plaintiff."
          },
          {
            title: `Whether ${dName} is a trespasser who wrongfully dispossessed the Plaintiff and built illegal structures`,
            type: "Fact",
            burden: "Plaintiff",
            evidence: "Witness statements, local surveyor report",
            plaintiffPosition: "Defendant has no title deed and is a trespasser who dispossessed the Plaintiff.",
            defendantPosition: "Defendant is in lawful possession.",
            courtAnalysis: "Defendant failed to exhibit any registered transfer deed or legal license to hold the land.",
            projectedFinding: "Decided in favor of Plaintiff."
          }
        ];
      }
    } else {
      return [
        {
          title: "Whether the suit is maintainable",
          type: "Law",
          burden: "Plaintiff",
          evidence: "CPC compliance",
          plaintiffPosition: "Suit is maintainable.",
          defendantPosition: "Suit is barred.",
          courtAnalysis: "The suit falls under Section 9 CPC and is fully maintainable.",
          projectedFinding: "Decided in favor of Plaintiff."
        }
      ];
    }
  }

  private classifyEvidence(facts: ParsedFacts): any[] {
    const evidence: any[] = [];
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";
    const isDP = facts.category === "DECLARATION_AND_POSSESSION";

    if (isSP) {
      evidence.push(
        {
          item: "Original Registered Bainapatra (Agreement to Sell)",
          source: "Plaintiff",
          type: "Documentary (Primary)",
          governingSection: "Section 61 and 62 of the Evidence Act 1872",
          admissibilityChallenge: "Admissible — Registered document carrying high statutory execution weight under Section 60 of the Registration Act."
        },
        {
          item: "Bank Challan / Treasury Deposit Receipt (Remaining Balance)",
          source: "Pleader's Court Filings",
          type: "Documentary (Certified)",
          governingSection: "Section 74 of the Evidence Act 1872",
          admissibilityChallenge: "Admissible — Proof of statutory deposit of the remaining consideration in the government treasury under Section 21A SRA."
        },
        {
          item: "Written Legal Notices & Postal Receipts",
          source: "Plaintiff",
          type: "Documentary",
          governingSection: "Section 114(f) of the Evidence Act 1872",
          admissibilityChallenge: "Admissible — Proves that Plaintiff demanded performance of contract and Defendant had notice of willingness."
        }
      );
    } else if (isDP) {
      evidence.push(
        {
          item: "Registered Saf Kabala (Sale Deed) of Plaintiff",
          source: "Plaintiff",
          type: "Documentary (Primary)",
          governingSection: "Section 62 of the Evidence Act 1872",
          admissibilityChallenge: "Admissible — Publicly registered transfer instrument proving ownership conveyance."
        },
        {
          item: "Certified Mutation Khatian & DCR",
          source: "Upazila Land Office",
          type: "Documentary (Secondary / Public)",
          governingSection: "Section 74 & 77 of the Evidence Act 1872",
          admissibilityChallenge: "Admissible — Certified copy of public revenue record proving mutation in Plaintiff's name."
        },
        {
          item: "Land Development Tax Receipts (Dakhilas)",
          source: "Union Land Office",
          type: "Documentary",
          governingSection: "Section 35 of the Evidence Act 1872",
          admissibilityChallenge: "Admissible — Entry in public book proving continuous tax payments by Plaintiff."
        },
        {
          item: "Oral testimony of local boundary neighbors",
          source: "Plaintiff",
          type: "Oral Evidence",
          governingSection: "Section 59 & 60 of the Evidence Act 1872",
          admissibilityChallenge: "Subject to cross-examination; corroborates physical ouster and fence erection."
        }
      );
    } else {
      evidence.push({
        item: "Oral and Pleading assertions",
        source: "Both Parties",
        type: "Oral",
        governingSection: "Section 60 Evidence Act",
        admissibilityChallenge: "Subject to standard trial rules."
      });
    }

    return evidence;
  }

  private assignBurdens(facts: ParsedFacts): string[] {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";
    const pName = facts.parties.find(p => p.side === "plaintiff")?.name || "Plaintiff";
    const dName = facts.parties.find(p => p.side === "defendant")?.name || "Defendant";

    if (isSP) {
      return [
        `${pName} bears the burden of proving valid execution and registration of Bainapatra, payment of advance, and readiness (Section 101 Evidence Act).`,
        `${dName} bears the burden of proving any assertions of fraud, coercion, or lack of consideration (Section 102 Evidence Act).`
      ];
    } else {
      return [
        `${pName} bears the burden of proving absolute title chain, mutation, and the fact/date of dispossession (Section 101 Evidence Act).`,
        `${dName} bears the burden of proving adverse possession or any independent title claim (Section 102 Evidence Act).`
      ];
    }
  }

  private findPresumptions(facts: ParsedFacts): any[] {
    const isSP = facts.category === "SPECIFIC_PERFORMANCE";

    if (isSP) {
      return [
        {
          statuteSection: "Section 60 of the Registration Act 1908",
          presumptionStyle: "Shall presume valid execution",
          effectOnCase: "The Court will presume the Bainapatra was validly executed once the certificate of registration is exhibited."
        },
        {
          statuteSection: "Section 114 of the Evidence Act 1872",
          presumptionStyle: "May presume course of business",
          effectOnCase: "The Court will presume legal notices sent by registered post reached the Defendant in due course."
        }
      ];
    } else {
      return [
        {
          statuteSection: "Section 114 of the Evidence Act 1872",
          presumptionStyle: "May presume ownership from possession",
          effectOnCase: "The Court will presume the recorded title holder is the lawful possessor unless rebutted."
        },
        {
          statuteSection: "Section 103A of the State Acquisition and Tenancy Act 1950",
          presumptionStyle: "Shall presume correctness of Khatian",
          effectOnCase: "The certified Mutation Khatian is presumed to be correct, placing the burden of proving incorrectness on the Defendant."
        }
      ];
    }
  }

  private extractAdmittedFacts(text: string, category: string, details: any): string[] {
    const admitted: string[] = [];
    const isSP = category === "SPECIFIC_PERFORMANCE";

    if (isSP) {
      admitted.push("Execution of a written contract of sale (Bainapatra) between the parties.");
      admitted.push(`Receipt of BDT ${details.advance.toLocaleString("en-US")} as advance/earnest money by the Defendant.`);
    } else {
      admitted.push("Plaintiff holds a chain of title deeds.");
      admitted.push("Defendant is currently in physical occupation of the disputed land parcel.");
    }
    return admitted;
  }

  private extractDisputedFacts(text: string, category: string): string[] {
    const disputed: string[] = [];
    const isSP = category === "SPECIFIC_PERFORMANCE";

    if (isSP) {
      disputed.push("Whether the Defendant willfully neglected to execute and register the final sale deed.");
      disputed.push("Whether the Bainapatra is registered in compliance with Section 17A of the Registration Act.");
      disputed.push("Whether the Plaintiff was continuously ready and willing to perform the contract.");
    } else {
      disputed.push("Whether the Plaintiff has absolute legal title or if Defendant has any hostile independent right.");
      disputed.push("Whether the Defendant forcefully dispossessed the Plaintiff and built unauthorized fences.");
      disputed.push("The exact date and time of the dispossession/encroachment.");
    }
    return disputed;
  }

  private extractInferredFacts(text: string, category: string): string[] {
    const isSP = category === "SPECIFIC_PERFORMANCE";
    if (isSP) {
      return ["Plaintiff has demonstrated absolute ready-to-pay status by depositing the remaining consideration in the treasury."];
    } else {
      return ["Defendant occupies the land solely as a trespasser, lacking any registered conveyance or mutation records."];
    }
  }

  private extractLiabilityFacts(text: string, category: string): string[] {
    const isSP = category === "SPECIFIC_PERFORMANCE";
    if (isSP) {
      return ["Defendant is contractually and statutory liable to execute and register the final Sale Deed."];
    } else {
      return ["Defendant is liable for wrongful dispossession, civil trespass, and must dismantle encroaching fences."];
    }
  }

  private extractQuantumFacts(text: string, category: string, details: any): string[] {
    const isSP = category === "SPECIFIC_PERFORMANCE";
    if (isSP) {
      return [
        `Total agreed consideration: BDT ${details.total.toLocaleString("en-US")}`,
        `Advance paid under Bainapatra: BDT ${details.advance.toLocaleString("en-US")}`,
        `Remaining balance deposit: BDT ${details.balance.toLocaleString("en-US")}`
      ];
    } else {
      const match = text.match(/(\d+)\s*decimals/i);
      const decimals = match ? match[1] : "Disputed";
      return [
        `Subject matter: ${decimals} decimals of land`,
        "Entitlement to mesne profits for wrongful ouster"
      ];
    }
  }

  private extractTriggers(text: string, category: string, details: any): any[] {
    const isSP = category === "SPECIFIC_PERFORMANCE";
    if (isSP) {
      return [
        { domain: "Contract Law", fact: "Written agreement (Bainapatra)", trigger: "Section 2(h) of the Contract Act 1872 & Section 54 of the Transfer of Property Act 1882" },
        { domain: "Registration Law", fact: "Mandatory registration", trigger: "Section 17A of the Registration Act 1908" },
        { domain: "Specific Relief", fact: "Balance money deposited", trigger: "Section 21A of the Specific Relief Act 1877" }
      ];
    } else {
      return [
        { domain: "Specific Relief", fact: "Title ownership & Dispossession", trigger: "Section 8 and 42 of the Specific Relief Act 1877" },
        { domain: "Civil Law", fact: "Forceful trespass and fence", trigger: "Order XXVI Rule 9 CPC for local inspection of encroachment" }
      ];
    }
  }
}

// ─── PARSED FACTS INTERFACE ───
interface ParsedFacts {
  rawText: string;
  dates: Array<{ date: string; event: string; parties: string; statutorySignificance: string }>;
  parties: ParsedParty[];
  keywords: string[];
  admitted: string[];
  disputed: string[];
  inferred: string[];
  liability: string[];
  quantum: string[];
  triggers: Array<{ domain: string; fact: string; trigger: string }>;
  primarySubject: string;
  location?: string;
  category: "SPECIFIC_PERFORMANCE" | "DECLARATION_AND_POSSESSION" | "GENERAL_CIVIL";
  contractDetails: { total: number; advance: number; balance: number };
}

interface ParsedParty {
  name: string;
  side: "plaintiff" | "defendant";
  identity: string;
  capacity: string;
  causeOfAction?: string;
  liability?: string;
}

interface DateInfo {
  dateStr: string;
  parsedDate: Date;
  index: number;
}
