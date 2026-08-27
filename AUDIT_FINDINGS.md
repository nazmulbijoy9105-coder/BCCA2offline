# BCCAA P0/P1/P2 Comprehensive Audit
Branch: audit/P0-P1-P2-comprehensive
Commit: 55e72e1
Date: 2026-08-28T04:42:54+06:00

## P0 — Engine Correctness
### 1. Null / Undefined Boundary Risks (non-optional-chained property access)
src/engine/BCCAAEngine.ts:536:  if (ctx.predicateConflictModes.has(key)) {
src/engine/BCCAAEngine.ts:537:    return ctx.predicateConflictModes.get(key)!;
src/engine/BCCAAEngine.ts:540:  if (ctx.predicateConflictModes.has(predKey)) {
src/engine/BCCAAEngine.ts:541:    return ctx.predicateConflictModes.get(predKey)!;
src/engine/BCCAAEngine.ts:570:  const stepId = `TRACE-${String(ctx.executionTrace.length + 1).padStart(5, "0")}`;
src/engine/BCCAAEngine.ts:571:  ctx.executionTrace.push({ stepId, ...step });
src/engine/BCCAAEngine.ts:575:  return Array.from(ctx.factRegistry.keys());
src/engine/BCCAAEngine.ts:750:  if (!EXTRACTION_SATISFIES[String(req.extractionRequired)].has(fact.validation.extractionStatus)) {
src/engine/BCCAAEngine.ts:753:  if (!SOURCE_SATISFIES[req.sourceRequired].has(fact.validation.sourceStatus)) {
src/engine/BCCAAEngine.ts:756:  if (!AUTH_SATISFIES[req.authenticationRequired].has(fact.validation.authenticationStatus)) {
src/engine/BCCAAEngine.ts:759:  if (!CORR_SATISFIES[req.corroborationRequired].has(fact.validation.corroborationStatus)) {
src/engine/BCCAAEngine.ts:762:  if (!HV_SATISFIES[req.humanValidationRequired].has(fact.validation.humanValidationStatus)) {
src/engine/BCCAAEngine.ts:997:        ...f.validation,
src/engine/BCCAAEngine.ts:1217:    request.input.submissionDate = request.input.submissionDate || "2024-01-01";
src/engine/BCCAAEngine.ts:1222:      const license = await this.licenseValidator.validate(request.user, request.license);
src/engine/BCCAAEngine.ts:1231:      if (request.input.factPattern.length > MAX_INPUT_LENGTH) {
src/engine/BCCAAEngine.ts:1269:    const chronology = ctx.eventTimeline.map((e) => ({
src/engine/BCCAAEngine.ts:1273:      factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
src/engine/BCCAAEngine.ts:1274:      conflictInfo: ctx.contradictionGraph.length > 0
src/engine/BCCAAEngine.ts:1276:            total: ctx.contradictionGraph.length,
src/engine/BCCAAEngine.ts:1277:            critical: ctx.contradictionGraph.filter((edge) => edge.status === "CRITICAL").length,
src/engine/BCCAAEngine.ts:1278:            edges: ctx.contradictionGraph.map((edge) => ({
src/engine/BCCAAEngine.ts:1293:      Array.from(ctx.factRegistry.values()).map((f) => ({
src/engine/BCCAAEngine.ts:1297:      ctx.contradictionGraph.map((e) => ({
src/engine/BCCAAEngine.ts:1369:          ctx.assertionRegistry.set(assertionId, {
src/engine/BCCAAEngine.ts:1379:          const existingFact = Array.from(ctx.factRegistry.values()).find(
src/engine/BCCAAEngine.ts:1437:          ctx.factRegistry.set(factId, fact);
src/engine/BCCAAEngine.ts:1452:    const existing = Array.from(ctx.propositionRegistry.values()).find((p) => p.canonicalKey === canonicalKey);
src/engine/BCCAAEngine.ts:1455:    ctx.propositionRegistry.set(propositionId, {
src/engine/BCCAAEngine.ts:1463:    const validated = await this.factValidationProvider.validateFacts({
src/engine/BCCAAEngine.ts:1464:      facts: Array.from(ctx.factRegistry.values()),
src/engine/BCCAAEngine.ts:1465:      propositions: Array.from(ctx.propositionRegistry.values()),
src/engine/BCCAAEngine.ts:1466:      assertions: Array.from(ctx.assertionRegistry.values()),
src/engine/BCCAAEngine.ts:1468:    if (validated.length !== ctx.factRegistry.size) {
src/engine/BCCAAEngine.ts:1472:      const original = ctx.factRegistry.get(fact.factId);
src/engine/BCCAAEngine.ts:1486:      const providerAllowsPromotion = this.factValidationProvider.setsTruth === true;
src/engine/BCCAAEngine.ts:1499:      ctx.factRegistry.set(fact.factId, fact);
src/engine/BCCAAEngine.ts:1923:    const existingKeys = new Set(Array.from(ctx.factRegistry.values()).map((f) => `${f.subject}|${f.predicate}`.toUpperCase()));
src/engine/BCCAAEngine.ts:1938:        ctx.assertionRegistry.set(assertionId, { assertionId, propositionId, assertionType: AssertionType.ALLEGED, polarity: AssertionPolarity.UNKNOWN, sourceSpan: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" } });
src/engine/BCCAAEngine.ts:1939:        ctx.factRegistry.set(factId, { factId, propositionId, assertionId, proposition: `[AUTO] ${subject} ${predicate} — not mentioned in input`, subject, predicate, object: null, truth: Tristate.UNKNOWN, polarity: AssertionPolarity.UNKNOWN, source: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" }, assertionType: AssertionType.ALLEGED, validationStatus: ValidationStatus.UNVERIFIED, confidence: FactConfidence.CANDIDATE, validation: { extractionStatus: ExtractionStatus.NOT_EXECUTED, sourceStatus: SourceStatus.UNRESOLVED, authenticationStatus: AuthenticationStatus.NOT_EXECUTED, corroborationStatus: CorroborationStatus.NOT_EXECUTED, humanValidationStatus: HumanValidationStatus.NOT_EXECUTED } });

### 2. Array Methods (.map, .filter, .reduce, .find, .join, .forEach, .some, .every, .flatMap)
src/engine/BCCAAEngine.deterministic.test.ts:66:      verifiedPrecedentCount: stage2?.precedents?.filter(
src/engine/BCCAAEngine.deterministic.test.ts:168:        .map((f: any) => f.object)
src/engine/BCCAAEngine.deterministic.test.ts:169:        .filter(Boolean);
src/engine/BCCAAEngine.deterministic.test.ts:180:      const deathFacts = (r.stage0?.atomicFacts ?? []).filter(
src/engine/BCCAAEngine.deterministic.test.ts:195:      const depositFacts = (r.stage0?.atomicFacts ?? []).filter(
src/engine/BCCAAEngine.deterministic.test.ts:497:      const hasFormatted = qf.some((q: string) => q.includes("5,00,000") || q.includes("500000"));
src/engine/BCCAAEngine.phase1.test.ts:1:import { describe, it, expect } from "vitest"; import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from "./BCCAAEngine"; const engine = new BCCAAEngine({ licenseValidator: { validate: async () => ({ valid: true, licenseId: "TEST", issuedTo: "TEST" }) }, factValidationProvider: new NoOpFactValidationProvider() }); function makeRequest(o: any = {}) { return { caseId: o.caseId ?? "P1-TEST", user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any, license: { licenseId: "TEST", issuedTo: "TEST" }, input: { factPattern: o.factPattern ?? "The plaintiff relied on an unregistered bainapatra.", submissionDate: o.submissionDate } }; } describe("P1-01: Semantic determinism", () => { it("SPECIFIC_PERFORMANCE identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01", factPattern: "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); it("death pattern identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01-SC", factPattern: "The plaintiff father died on 10 March 2020. The property is Khatian No. 456.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); }); describe("P1-02: Temporal determinism", () => { it("3-year limitation from 2020 refusal is TIME_BARRED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-02", factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.", submissionDate: "2024-01-15" })); expect(r.stage3.isTimeBarred).toBe(true); expect(r.stage3.accrualDate).toBe("2020-08-20"); }); }); describe("P1-03: Fact extraction", () => { it("UNREGISTERED in atomicFacts", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-REG", factPattern: "The plaintiff relied on an unregistered bainapatra." })); const objs = (r.stage0?.atomicFacts ?? []).map((f: any) => f.object).filter(Boolean); expect(objs).toContain("UNREGISTERED"); }); it("death fact extracted as DECEASED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-DEATH", factPattern: "The plaintiff father died on 10 March 2020." })); const deathFacts = (r.stage0?.atomicFacts ?? []).filter((f: any) => f.predicate === "Vital Status" && f.object === "DECEASED"); expect(deathFacts.length).toBeGreaterThanOrEqual(1); expect(deathFacts[0].subject).toBe("Ancestor"); }); });
src/engine/BCCAAEngine.phase1b.test.ts:138:    const disputedFacts = r.stage0!.atomicFacts!.filter(
src/engine/BCCAAEngine.phase1b.test.ts:141:    const disputedAssertions = (r.stage0.assertions ?? []).filter(
src/engine/BCCAAEngine.phase1b.test.ts:154:    const admittedFacts = r.stage0!.atomicFacts!.filter((f: any) => f.assertionType === "ADMITTED");
src/engine/BCCAAEngine.phase1b.test.ts:155:    const admittedAssertions = (r.stage0.assertions ?? []).filter(
src/engine/BCCAAEngine.phase1b.test.ts:168:    const unknowns = r.stage0!.atomicFacts!.filter(
src/engine/BCCAAEngine.phase1b.test.ts:187:      ...r.stage0!.atomicFacts!.map((f: any) => `${f.predicate} ${f.object} ${f.proposition}`),
src/engine/BCCAAEngine.phase1b.test.ts:188:      ...r.stage0!.propositions!.map((p: any) => String(p)),
src/engine/BCCAAEngine.phase1b.test.ts:189:    ].join(" ").toLowerCase();
src/engine/BCCAAEngine.phase1b.test.ts:194:    const numericHits = [has10, has5, has15].filter(Boolean).length;
src/engine/BCCAAEngine.phase1b.test.ts:219:    r.stage0!.provenance!.forEach((p: any, i: number) => {
src/engine/BCCAAEngine.phase1b.test.ts:234:    r.stage0!.eventTimeline!.forEach((e: any) => {
src/engine/BCCAAEngine.phase2.test.ts:60:    expect(facts.some((f: any) => f.predicate === "Ownership Structure" && f.object === "JOINT")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:70:    expect(facts.some((f: any) => f.predicate === "Possession Status")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:79:    expect(facts.some((f: any) => f.predicate === "Mutation Status")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:88:    expect(facts.some((f: any) => f.predicate === "Area")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:177:    expect(r1.stage0!.atomicFacts!.some((f: any) => f.object === "DECEASED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:178:    expect(r2.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:179:    expect(r1.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(false);
src/engine/BCCAAEngine.phase2.test.ts:180:    expect(r2.stage0!.atomicFacts!.some((f: any) => f.object === "DECEASED")).toBe(false);
src/engine/BCCAAEngine.phase2.test.ts:191:    const results = await Promise.all(inputs.map((i) => engine.analyze(i)));
src/engine/BCCAAEngine.phase2.test.ts:192:    expect(results[0]!.stage0!.atomicFacts!.some((f: any) => f.object === "REGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:193:    expect(results[1]!.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:194:    expect(results[2]!.stage0!.atomicFacts!.some((f: any) =>
src/engine/BCCAAEngine.phase2.test.ts:208:    const results = await Promise.all(inputs.map((i) => engine.analyze(i)));
src/engine/BCCAAEngine.phase2.test.ts:209:    expect(results[0]!.stage0!.atomicFacts!.some((f: any) => f.object === "REGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:210:    expect(results[1]!.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:211:    expect(results[2]!.stage0!.atomicFacts!.some((f: any) =>
src/engine/BCCAAEngine.phase3.test.ts:50:    const canonical = results.map((r) => canonicalStringify(r));
src/engine/BCCAAEngine.ts:588:  if (Array.isArray(value)) return value.map(canonicalize);
src/engine/BCCAAEngine.ts:992:    return facts.map((f) => ({
src/engine/BCCAAEngine.ts:1011:    return facts.map((f) => {
src/engine/BCCAAEngine.ts:1067:    const p = s.split(/[-\/]/); [y, m, d] = p.map(Number); m -= 1;
src/engine/BCCAAEngine.ts:1075:  if ([y, m, d].some(isNaN) || y < 1 || m < 0 || m > 11 || d < 1 || d > 31) return null;
src/engine/BCCAAEngine.ts:1269:    const chronology = ctx.eventTimeline.map((e) => ({
src/engine/BCCAAEngine.ts:1273:      factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
src/engine/BCCAAEngine.ts:1277:            critical: ctx.contradictionGraph.filter((edge) => edge.status === "CRITICAL").length,
src/engine/BCCAAEngine.ts:1278:            edges: ctx.contradictionGraph.map((edge) => ({
src/engine/BCCAAEngine.ts:1293:      Array.from(ctx.factRegistry.values()).map((f) => ({
src/engine/BCCAAEngine.ts:1297:      ctx.contradictionGraph.map((e) => ({
src/engine/BCCAAEngine.ts:1379:          const existingFact = Array.from(ctx.factRegistry.values()).find(
src/engine/BCCAAEngine.ts:1452:    const existing = Array.from(ctx.propositionRegistry.values()).find((p) => p.canonicalKey === canonicalKey);
src/engine/BCCAAEngine.ts:1529:    const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
src/engine/BCCAAEngine.ts:1530:    return sentences.map((s) => {
src/engine/BCCAAEngine.ts:1541:      .map((x) => x.trim()).filter(Boolean);
src/engine/BCCAAEngine.ts:1656:    const hasSemantic = candidates.some((c) => c.predicate !== "Quantum Amount" && /^(Tk\.?|taka|bdt)/i.test(c.object || ""));
src/engine/BCCAAEngine.ts:1923:    const existingKeys = new Set(Array.from(ctx.factRegistry.values()).map((f) => `${f.subject}|${f.predicate}`.toUpperCase()));
src/engine/BCCAAEngine.ts:1999:    const criticalEdges = ctx.contradictionGraph.filter((e) => e.status === "CRITICAL");
src/engine/BCCAAEngine.ts:2004:        dependsOnFacts: criticalEdges.flatMap((e) => [e.leftFactId, e.rightFactId]),
src/engine/BCCAAEngine.ts:2006:        result: `EDGES:[${criticalEdges.map((e) => e.edgeId).join(",")}]`,
src/engine/BCCAAEngine.ts:2017:    const factsWithDates = Array.from(ctx.factRegistry.values()).filter(
src/engine/BCCAAEngine.ts:2079:    const familyFacts = Array.from(ctx.factRegistry.values()).filter(
src/engine/BCCAAEngine.ts:2083:      .filter((f) => f.truth === Tristate.TRUE)
src/engine/BCCAAEngine.ts:2084:      .map((f) => ({ factId: f.factId, object: f.object, truth: f.truth }));
src/engine/BCCAAEngine.ts:2085:    const conflictDetected = sameFamilyConflictingFacts.length > 1 && new Set(sameFamilyConflictingFacts.map((f) => f.object)).size > 1;
src/engine/BCCAAEngine.ts:2087:      ? familyFacts.filter((f) => f.object?.toUpperCase() === objectFilter.toUpperCase())
src/engine/BCCAAEngine.ts:2174:    const dates = facts.filter((f) => f.eventDate && isStrictDate(f.eventDate)).map((f) => f.eventDate!);
src/engine/BCCAAEngine.ts:2175:    const refusalDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Refusal Date"));
src/engine/BCCAAEngine.ts:2176:    const dispossessionDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Dispossession Date"));
src/engine/BCCAAEngine.ts:2177:    const demandDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Demand Date"));
src/engine/BCCAAEngine.ts:2178:    const deathDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Vital Status" && f.object === "DECEASED"));
src/engine/BCCAAEngine.ts:2179:    const executionDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Execution Date"));
src/engine/BCCAAEngine.ts:2320:        if (predicateResults.some((pr) => pr.status === "UNKNOWN")) {
src/engine/BCCAAEngine.ts:2348:    const partyFacts = Array.from(ctx.factRegistry.values()).filter(
src/engine/BCCAAEngine.ts:2354:      .filter((f) => f.subject === "Plaintiff" && f.predicate === "Party Identity" && f.object)
src/engine/BCCAAEngine.ts:2355:      .map((f) => f.object!)
src/engine/BCCAAEngine.ts:2356:      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe while preserving order
src/engine/BCCAAEngine.ts:2360:      .filter((f) => f.subject === "Defendant" && f.predicate === "Party Identity" && f.object)
src/engine/BCCAAEngine.ts:2361:      .map((f) => f.object!)
src/engine/BCCAAEngine.ts:2362:      .filter((v, i, arr) => arr.indexOf(v) === i);
src/engine/BCCAAEngine.ts:2366:      .filter((f) => f.predicate === "Party Role" && f.object === "PLAINTIFF" && f.object)
src/engine/BCCAAEngine.ts:2367:      .map((f) => f.subject)
src/engine/BCCAAEngine.ts:2368:      .filter((v, i, arr) => arr.indexOf(v) === i);
src/engine/BCCAAEngine.ts:2371:      .filter((f) => f.predicate === "Party Role" && f.object === "DEFENDANT" && f.object)
src/engine/BCCAAEngine.ts:2372:      .map((f) => f.subject)
src/engine/BCCAAEngine.ts:2373:      .filter((v, i, arr) => arr.indexOf(v) === i);
src/engine/BCCAAEngine.ts:2384:      ? `Plaintiff(s): ${plaintiffs.join(", ")}; Defendant(s): ${defendants.join(", ")}`
src/engine/BCCAAEngine.ts:2404:      grounds.push(`Missing elements: ${elementGate.missingElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2407:      grounds.push(`Unknown elements: ${elementGate.unknownElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2440:      .filter((e) => e.status === "CRITICAL")
src/engine/BCCAAEngine.ts:2441:      .map((e) => `Critical contradiction on ${e.propositionKey}`);
src/engine/BCCAAEngine.ts:2456:    const oral = facts.filter((f) => f.assertionType === AssertionType.PARTY_NARRATIVE || f.assertionType === AssertionType.ALLEGED).length;
src/engine/BCCAAEngine.ts:2457:    const documentary = facts.filter((f) => f.assertionType === AssertionType.DOCUMENTARY_FACT).length;
src/engine/BCCAAEngine.ts:2459:    if (!facts.some((f) => f.predicate === "Registration Status")) {
src/engine/BCCAAEngine.ts:2462:    if (!facts.some((f) => f.predicate === "Payment Status")) {
src/engine/BCCAAEngine.ts:2477:    const satisfied = elementGate.ruleExecutionResults.filter((r) => r.status === "SATISFIED").length;
src/engine/BCCAAEngine.ts:2569:    const elementSummary = elementGate.ruleExecutionResults.map((r) => ({
src/engine/BCCAAEngine.ts:2592:        humanReviewReason: elementGate.fatalFailures.join("; "),
src/engine/BCCAAEngine.ts:2615:      humanReviewReason: `Missing: ${elementGate.missingElements.join(", ")}; Unknown: ${elementGate.unknownElements.join(", ")}`,
src/engine/BCCAAEngine.ts:2649:    const atomicFacts = Array.from(ctx.factRegistry.values()).map((f) => ({
src/engine/BCCAAEngine.ts:2690:        propositions: atomicFacts.map((f) => f.proposition),
src/engine/BCCAAEngine.ts:2691:        provenance: atomicFacts.map((f) => ({ factId: f.factId, source: f.source,
src/engine/BCCAAEngine.ts:2698:        quantumFacts: atomicFacts.filter((f) => f.predicate.toLowerCase().includes("amount") || f.predicate.toLowerCase().includes("consideration") || f.predicate.toLowerCase().includes("deposit") || f.predicate.toLowerCase().includes("valuation")).map((f) => `${f.predicate}: ${f.object ?? "N/A"}`),
src/engine/BCCAAEngine.ts:2721:        plaintiffs: deps.standi.plaintiffs.map((name: string) => ({
src/engine/BCCAAEngine.ts:2727:        defendants: deps.standi.defendants.map((name: string) => ({
src/engine/BCCAAEngine.ts:2903:        atomicFacts: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, propositionId: f.propositionId, assertionId: f.assertionId, proposition: f.proposition, subject: f.subject, predicate: f.predicate, object: f.object, truth: f.truth, polarity: f.polarity, source: f.source, assertionType: f.assertionType, validationStatus: f.validationStatus, confidence: f.confidence, assertedBy: f.assertedBy, eventDate: f.eventDate, normalizedValue: f.normalizedValue, contradicts: f.contradicts, supports: f.supports, disputedProposition: f.disputedProposition, validation: f.validation, provenanceAssertions: f.provenanceAssertions })),
src/engine/BCCAAEngine.ts:2904:        propositions: Array.from(ctx.factRegistry.values()).map((f) => f.proposition),
src/engine/BCCAAEngine.ts:2905:        provenance: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, source: f.source,
src/engine/BCCAAEngine.ts:3000:    const factRegistryHash = canonicalHash(facts.map((f) => ({ factId: f.factId, subject: f.subject, predicate: f.predicate, object: f.object, truth: f.truth, eventDate: f.eventDate, normalizedValue: f.normalizedValue })));
src/engine/BCCAAEngine.ts:3004:    const extractionHash = canonicalHash(facts.map((f) => f.proposition));
src/engine/BCCAAEngine.ts:3049:        atomicFacts: (response.stage0?.atomicFacts ?? []).map((f) => ({
src/engine/BCCAAEngine.ts:3059:        contradictionGraph: (response.stage0?.contradictionGraph ?? []).map((e) => ({
src/engine/BCCAAEngine.ts:3066:        eventTimeline: (response.stage0?.eventTimeline ?? []).map((e) => ({
src/engine/BCCAAEngine.ts:3090:        ruleExecutionResults: (response.stage8?.ruleExecutionResults ?? []).map((r) => ({
src/engine/BCCAAEngine.ts:3093:          predicateResults: r.predicateResults.map((p: any) => ({
src/engine/BCCAAEngine.ts:3127:    const fact = Array.from(ctx.factRegistry.values()).find(
src/engine/CitationValidator.ts:412:      match = Object.values(CANONICAL_PRECEDENT_REGISTRY).find(
src/engine/CitationValidator.ts:447:      statutorySubject: match.statutorySubjects.join("; "),
src/engine/CitationValidator.ts:570:    return selected.filter((p) => p.verificationStatus === "VERIFIED_CANONICAL");
src/engine/CitationValidator.ts:577:    return rawPrecedents.map((p) => this.validate(p.citation, p.relevance));
src/engine/FactConsistencyGate.ts:112:    const engineDeathFacts = (engineFacts ?? []).filter(
src/engine/FactConsistencyGate.ts:118:    const engineLivingFacts = (engineFacts ?? []).filter(
src/engine/FactConsistencyGate.ts:140:      engineDeathFacts.forEach((f, idx) => {
src/engine/FactConsistencyGate.ts:153:      deathMatches.forEach((m, idx) => {
src/engine/FactConsistencyGate.ts:168:      engineLivingFacts.forEach((f, idx) => {
src/engine/FactConsistencyGate.ts:181:      livingMatches.forEach((m, idx) => {
src/engine/FactConsistencyGate.ts:196:    chronology.forEach((c) => {
src/engine/FactConsistencyGate.ts:255:    const importedCriticalEdges = (engineConflicts ?? []).filter(
src/engine/FactConsistencyGate.ts:264:      atomicFacts.some(
src/engine/FactConsistencyGate.ts:271:      atomicFacts.some((f) =>
src/engine/FactConsistencyGate.ts:287:        atomicFacts.find((f) => f.proposition.includes("Ancestor death"))
src/engine/FactConsistencyGate.ts:290:        atomicFacts.find((f) => f.proposition.includes("alive"))?.factId ||
src/engine/FactConsistencyGate.ts:326:    deathMatches.forEach((m) => extractedDeathDates.push(m[1].trim()));
src/engine/FactConsistencyGate.ts:327:    const deathChronos = chronology.filter(
src/engine/FactConsistencyGate.ts:333:    deathChronos.forEach((dc) => extractedDeathDates.push(dc.date.trim()));
src/engine/FactConsistencyGate.ts:352:    const normalizedDates = extractedDeathDates.map(normalizeDateForDedup);
src/engine/FactConsistencyGate.ts:362:        description: `Multiple contradictory death dates extracted for the same ancestor: [${uniqueDeathDates.join(" vs. ")}]. Under Article 123/144 of the Limitation Act, exact date of demise determines the 12-year statutory limitation deadline.`,
src/engine/FactConsistencyGate.ts:522:          ? `Missing statutory documents: ${missingDocs.join("; ")}`
src/engine/FactConsistencyGate.ts:529:    const criticalCount = conflicts.filter(
src/engine/FactConsistencyGate.ts:532:    const materialCount = conflicts.filter(

### 3. Nested Request Access (request.*.*)
src/engine/BCCAAEngine.ts:1216:    request.input.factPattern = String(request.input.factPattern ?? "").trim();
src/engine/BCCAAEngine.ts:1217:    request.input.submissionDate = request.input.submissionDate || "2024-01-01";
src/engine/BCCAAEngine.ts:1231:      if (request.input.factPattern.length > MAX_INPUT_LENGTH) {
src/engine/BCCAAEngine.ts:2675:      userId: request.user.id,
src/engine/BCCAAEngine.ts:2676:      licenseId: request.license.licenseId,
src/engine/BCCAAEngine.ts:2889:      userId: request.user.id,
src/engine/BCCAAEngine.ts:2890:      licenseId: request.license.licenseId,
src/engine/BCCAAEngine.ts:3003:    const rawInputHash = canonicalHash(request.input.factPattern);
src/engine/BCCAAEngine.ts:3030:      analyzedByUserId: request.user.id,

### 4. JSON.parse(JSON.stringify()) — Deep Clone Audit
src/engine/BCCAAEngine.ts:1208:    request = JSON.parse(JSON.stringify(request));

### 5. Mutating Operations (.push, .pop, .shift, .unshift, .splice, .sort, .reverse, .copyWithin, .fill)
src/engine/BCCAAEngine.ts:571:  ctx.executionTrace.push({ stepId, ...step });
src/engine/BCCAAEngine.ts:591:    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
src/engine/BCCAAEngine.ts:1405:              existingFact.provenanceAssertions = Array.from(merged).sort();
src/engine/BCCAAEngine.ts:1520:        protectedMarks.push(match);
src/engine/BCCAAEngine.ts:1526:      protectedMarks.push(`${num}.`);
src/engine/BCCAAEngine.ts:1571:        candidates.push({ subject: "Plaintiff", predicate: "Party Identity", object: name });
src/engine/BCCAAEngine.ts:1572:        candidates.push({ subject: name, predicate: "Party Role", object: "PLAINTIFF" });
src/engine/BCCAAEngine.ts:1582:        candidates.push({ subject: "Defendant", predicate: "Party Identity", object: name });
src/engine/BCCAAEngine.ts:1583:        candidates.push({ subject: name, predicate: "Party Role", object: "DEFENDANT" });
src/engine/BCCAAEngine.ts:1591:      candidates.push({ subject: name, predicate: "Capacity", object: role });
src/engine/BCCAAEngine.ts:1604:      candidates.push({ subject: "Bainapatra", predicate: "Execution Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1608:      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "REGISTERED" });
src/engine/BCCAAEngine.ts:1613:      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "UNREGISTERED" });
src/engine/BCCAAEngine.ts:1618:      candidates.push({ subject: "Registration", predicate: "Case Number", object: regCaseMatch[1].trim() });
src/engine/BCCAAEngine.ts:1622:      candidates.push({ subject: "Registration", predicate: "Statutory Basis", object: "Section 17A" });
src/engine/BCCAAEngine.ts:1626:      candidates.push({ subject: "Specific Relief", predicate: "Statutory Basis", object: "Section 21A" });
src/engine/BCCAAEngine.ts:1650:          candidates.push({ subject: p.subject, predicate: p.predicate, object: `Tk. ${m[1]}`, normalizedValue: val });
src/engine/BCCAAEngine.ts:1662:          candidates.push({ subject: "Claim", predicate: "Quantum Amount", object: `Tk. ${mm[1]}`, normalizedValue: val });
src/engine/BCCAAEngine.ts:1673:      candidates.push({ subject: "Property", predicate: "Area", object: areaMatch[0] });
src/engine/BCCAAEngine.ts:1677:      candidates.push({ subject: "Property", predicate: "Ownership Structure", object: "JOINT" });
src/engine/BCCAAEngine.ts:1681:      candidates.push({ subject: "Property", predicate: "Mutation Status", object: "EXCLUSIVE_MUTATION" });
src/engine/BCCAAEngine.ts:1683:      candidates.push({ subject: "Property", predicate: "Mutation Status", object: "MUTATED" });
src/engine/BCCAAEngine.ts:1691:      candidates.push({ subject: "Treasury Deposit", predicate: "Payment Status", object: "DEPOSITED" });
src/engine/BCCAAEngine.ts:1695:        candidates.push({ subject: "Treasury Deposit", predicate: "Challan Number", object: challanMatch[1].trim() });
src/engine/BCCAAEngine.ts:1700:      candidates.push({ subject: "Plaintiff", predicate: "Title Status", object: "REGISTERED_OWNER" });
src/engine/BCCAAEngine.ts:1710:      candidates.push({ subject: "Defendant", predicate: "Refusal Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1712:      candidates.push({ subject: "Defendant", predicate: "Refusal Date", object: null });
src/engine/BCCAAEngine.ts:1719:      candidates.push({ subject: "Plaintiff", predicate: "Demand Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1726:      candidates.push({ subject: "Contract", predicate: "Performance Deadline", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1734:        candidates.push({ subject: "Ancestor", predicate: "Disowning Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1743:        candidates.push({ subject: "Media", predicate: "Publication Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1752:        candidates.push({ subject: "Heirship", predicate: "Certificate Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1761:        candidates.push({ subject: "Spouse", predicate: "Predeceased Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1780:        candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED", eventDate: date });
src/engine/BCCAAEngine.ts:1782:        candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED" });
src/engine/BCCAAEngine.ts:1787:      candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "ALIVE" });
src/engine/BCCAAEngine.ts:1791:      candidates.push({ subject: "Ancestor", predicate: "Succession Type", object: "INTESTATE" });
src/engine/BCCAAEngine.ts:1795:      candidates.push({ subject: "Ancestor", predicate: "Disowning Declaration", object: "DECLARED" });
src/engine/BCCAAEngine.ts:1807:      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "DISPOSSESSED" });
src/engine/BCCAAEngine.ts:1812:        candidates.push({ subject: "Plaintiff", predicate: "Dispossession Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1816:      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "IN_POSSESSION" });
src/engine/BCCAAEngine.ts:1820:      candidates.push({ subject: "Defendant", predicate: "Construction Status", object: "UNAUTHORIZED" });
src/engine/BCCAAEngine.ts:1926:      requiredPairs.push(["Bainapatra", "Registration Status"], ["Treasury Deposit", "Payment Status"], ["Bainapatra", "Execution Date"]);
src/engine/BCCAAEngine.ts:1928:      requiredPairs.push(["Plaintiff", "Title Status"], ["Plaintiff", "Possession Status"]);
src/engine/BCCAAEngine.ts:1930:      requiredPairs.push(["Ancestor", "Vital Status"], ["Ancestor", "Succession Type"], ["Property", "Ownership Structure"], ["Property", "Mutation Status"]);
src/engine/BCCAAEngine.ts:1950:      familyMap.get(familyKey)!.push(fact);
src/engine/BCCAAEngine.ts:1987:            ctx.contradictionGraph.push(edge);
src/engine/BCCAAEngine.ts:1990:            left.contradicts.push(right.factId);
src/engine/BCCAAEngine.ts:1991:            right.contradicts.push(left.factId);
src/engine/BCCAAEngine.ts:2008:      ctx.warnings.push(`CRITICAL: ${criticalEdges.length} contradiction edge(s) detected. F0 gate will evaluate.`);
src/engine/BCCAAEngine.ts:2020:    factsWithDates.sort((a, b) => strictDateTimestamp(a.eventDate!) - strictDateTimestamp(b.eventDate!));
src/engine/BCCAAEngine.ts:2026:      ctx.eventTimeline.push({
src/engine/BCCAAEngine.ts:2035:      ctx.eventTimeline.push({
src/engine/BCCAAEngine.ts:2102:        supportingFactIds.push(fact.factId);
src/engine/BCCAAEngine.ts:2112:        supportingFactIds.push(fact.factId);
src/engine/BCCAAEngine.ts:2120:        supportingFactIds.push(fact.factId);
src/engine/BCCAAEngine.ts:2296:        predicateResults.push({
src/engine/BCCAAEngine.ts:2316:      results.push(ruleResult);
src/engine/BCCAAEngine.ts:2321:          unknownElements.push(rule.ruleId);
src/engine/BCCAAEngine.ts:2323:          missingElements.push(rule.ruleId);
src/engine/BCCAAEngine.ts:2326:        fatalFailures.push(rule.ruleId);
src/engine/BCCAAEngine.ts:2404:      grounds.push(`Missing elements: ${elementGate.missingElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2407:      grounds.push(`Unknown elements: ${elementGate.unknownElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2409:    checklist.push("Plaint filed");
src/engine/BCCAAEngine.ts:2410:    checklist.push("Written statement filed");
src/engine/BCCAAEngine.ts:2425:      issues.push("Whether the bainapatra is registered");
src/engine/BCCAAEngine.ts:2428:      issues.push("Whether the balance consideration was deposited");
src/engine/BCCAAEngine.ts:2431:      issues.push("Whether the ancestor is deceased");
src/engine/BCCAAEngine.ts:2434:      issues.push("Whether the plaintiff holds registered title");
src/engine/BCCAAEngine.ts:2437:      issues.push("Whether the plaintiff was dispossessed");
src/engine/BCCAAEngine.ts:2442:    issues.push(...contradictionIssues);
src/engine/BCCAAEngine.ts:2460:      missing.push("Registration evidence");
src/engine/BCCAAEngine.ts:2463:      missing.push("Payment evidence");
src/engine/BCCAAEngine.ts:2496:      principles.push("Clean hands — plaintiff has satisfied all legal elements.");
src/engine/BCCAAEngine.ts:2499:      principles.push("No material contradictions — equitable relief favored.");
src/engine/CitationValidator.ts:476:      selected.push(
src/engine/CitationValidator.ts:491:      selected.push(
src/engine/CitationValidator.ts:508:        selected.push(
src/engine/CitationValidator.ts:528:        selected.push(
src/engine/CitationValidator.ts:541:        selected.push(
src/engine/CitationValidator.ts:557:      selected.push(
src/engine/FactConsistencyGate.ts:141:        atomicFacts.push({
src/engine/FactConsistencyGate.ts:154:        atomicFacts.push({
src/engine/FactConsistencyGate.ts:169:        atomicFacts.push({
src/engine/FactConsistencyGate.ts:182:        atomicFacts.push({
src/engine/FactConsistencyGate.ts:197:      atomicFacts.push({
src/engine/FactConsistencyGate.ts:214:      atomicFacts.push({
src/engine/FactConsistencyGate.ts:234:      atomicFacts.push({
src/engine/FactConsistencyGate.ts:293:      conflicts.push({
src/engine/FactConsistencyGate.ts:307:      auditTrail.push({
src/engine/FactConsistencyGate.ts:315:      auditTrail.push({
src/engine/FactConsistencyGate.ts:326:    deathMatches.forEach((m) => extractedDeathDates.push(m[1].trim()));
src/engine/FactConsistencyGate.ts:333:    deathChronos.forEach((dc) => extractedDeathDates.push(dc.date.trim()));
src/engine/FactConsistencyGate.ts:355:      conflicts.push({
src/engine/FactConsistencyGate.ts:368:      auditTrail.push({
src/engine/FactConsistencyGate.ts:375:      auditTrail.push({
src/engine/FactConsistencyGate.ts:401:      conflicts.push({
src/engine/FactConsistencyGate.ts:415:      auditTrail.push({
src/engine/FactConsistencyGate.ts:423:      auditTrail.push({
src/engine/FactConsistencyGate.ts:443:      conflicts.push({
src/engine/FactConsistencyGate.ts:457:      auditTrail.push({
src/engine/FactConsistencyGate.ts:464:      auditTrail.push({
src/engine/FactConsistencyGate.ts:480:        missingDocs.push(
src/engine/FactConsistencyGate.ts:489:        missingDocs.push(
src/engine/FactConsistencyGate.ts:501:        missingDocs.push(
src/engine/FactConsistencyGate.ts:510:        missingDocs.push(
src/engine/FactConsistencyGate.ts:516:    auditTrail.push({

### 6. UNKNOWN / FALSE Conversion Risks
src/engine/BCCAAEngine.ts:1267:      : ({ status: Tristate.UNKNOWN, supportingFactIds: [], conflictDetected: false, sameFamilyConflictingFacts: [] } as FactEvaluationResult);
src/engine/FactConsistencyGate.ts:218:          isRegistered: isReg ? true : isUnreg ? false : "UNKNOWN",

### 7. Fallback / Default / NOT_EXTRACTED / Hardcoded Values
src/engine/BCCAAEngine.deterministic.test.ts:73:      accrualDate: stage3?.accrualDate,
src/engine/BCCAAEngine.deterministic.test.ts:144:      expect(r.stage3.accrualDate).toBe("2020-08-20");
src/engine/BCCAAEngine.deterministic.test.ts:289:      expect(r.stage3.accrualDate).toBe("2020-08-20");
src/engine/BCCAAEngine.phase1.test.ts:1:import { describe, it, expect } from "vitest"; import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from "./BCCAAEngine"; const engine = new BCCAAEngine({ licenseValidator: { validate: async () => ({ valid: true, licenseId: "TEST", issuedTo: "TEST" }) }, factValidationProvider: new NoOpFactValidationProvider() }); function makeRequest(o: any = {}) { return { caseId: o.caseId ?? "P1-TEST", user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any, license: { licenseId: "TEST", issuedTo: "TEST" }, input: { factPattern: o.factPattern ?? "The plaintiff relied on an unregistered bainapatra.", submissionDate: o.submissionDate } }; } describe("P1-01: Semantic determinism", () => { it("SPECIFIC_PERFORMANCE identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01", factPattern: "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); it("death pattern identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01-SC", factPattern: "The plaintiff father died on 10 March 2020. The property is Khatian No. 456.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); }); describe("P1-02: Temporal determinism", () => { it("3-year limitation from 2020 refusal is TIME_BARRED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-02", factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.", submissionDate: "2024-01-15" })); expect(r.stage3.isTimeBarred).toBe(true); expect(r.stage3.accrualDate).toBe("2020-08-20"); }); }); describe("P1-03: Fact extraction", () => { it("UNREGISTERED in atomicFacts", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-REG", factPattern: "The plaintiff relied on an unregistered bainapatra." })); const objs = (r.stage0?.atomicFacts ?? []).map((f: any) => f.object).filter(Boolean); expect(objs).toContain("UNREGISTERED"); }); it("death fact extracted as DECEASED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-DEATH", factPattern: "The plaintiff father died on 10 March 2020." })); const deathFacts = (r.stage0?.atomicFacts ?? []).filter((f: any) => f.predicate === "Vital Status" && f.object === "DECEASED"); expect(deathFacts.length).toBeGreaterThanOrEqual(1); expect(deathFacts[0].subject).toBe("Ancestor"); }); });
src/engine/BCCAAEngine.phase1b.test.ts:22:/*  P1-04  Missing accrual tests                                              */
src/engine/BCCAAEngine.phase1b.test.ts:24:describe("P1-04: Missing accrual tests", () => {
src/engine/BCCAAEngine.phase1b.test.ts:25:  it("no dates provided → accrualDate is NOT_EXTRACTED", async () => {
src/engine/BCCAAEngine.phase1b.test.ts:30:    expect(r.stage3.accrualDate).toBe("NOT_EXTRACTED");
src/engine/BCCAAEngine.phase1b.test.ts:47:  it("only refusal date without agreement → falls back to NOT_EXTRACTED", async () => {
src/engine/BCCAAEngine.phase1b.test.ts:62:    expect(r.stage3.accrualDate).toBe("NOT_EXTRACTED");
src/engine/BCCAAEngine.phase1b.test.ts:74:    expect(r.stage3.accrualDate).toBe("2025-08-20");
src/engine/BCCAAEngine.phase2.test.ts:311:  it("null caseId is rejected or generates a fallback identifier", async () => {
src/engine/BCCAAEngine.phase3.test.ts:74:    expect(r.stage3.accrualDate).toBe("2020-08-20");
src/engine/BCCAAEngine.phase3.test.ts:83:    expect(r.stage3.accrualDate).toBe(r2.stage3.accrualDate);
src/engine/BCCAAEngine.phase3.test.ts:156:    expect(r.stage3.accrualDate).toBeDefined();
src/engine/BCCAAEngine.ts:42:  defaultFactsAllowed: false,
src/engine/BCCAAEngine.ts:1094:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:1099:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:1104:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:1655:    // Generic quantum fallback (only if no semantic match)
src/engine/BCCAAEngine.ts:2167:    accrualDate: string | null;
src/engine/BCCAAEngine.ts:2175:    const refusalDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Refusal Date"));
src/engine/BCCAAEngine.ts:2180:    let accrualDate: string | null = null;
src/engine/BCCAAEngine.ts:2187:      // accrual trigger. Execution/agreement context must independently
src/engine/BCCAAEngine.ts:2191:      // refusalDate may be a human-readable extracted value
src/engine/BCCAAEngine.ts:2193:      // authoritative accrualDate. Normalize it through the existing
src/engine/BCCAAEngine.ts:2195:      if (refusalDate && executionDate) {
src/engine/BCCAAEngine.ts:2196:        const refusalTs = strictDateTimestamp(refusalDate);
src/engine/BCCAAEngine.ts:2204:          accrualDate = toISODate(refusalDate);
src/engine/BCCAAEngine.ts:2208:          accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2213:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2220:        accrualDate = dispossessionDate;
src/engine/BCCAAEngine.ts:2224:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2230:        accrualDate = deathDate;
src/engine/BCCAAEngine.ts:2234:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2241:      // accrual trigger in this engine. Never promote an arbitrary
src/engine/BCCAAEngine.ts:2242:      // chronological event into an authoritative accrual date.
src/engine/BCCAAEngine.ts:2243:      accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2248:    // when the accrual trigger, limitation period, or reference date is
src/engine/BCCAAEngine.ts:2253:      accrualDate &&
src/engine/BCCAAEngine.ts:2254:      accrualDate !== "NOT_EXTRACTED" &&
src/engine/BCCAAEngine.ts:2258:      const accrualTs = strictDateTimestamp(accrualDate);
src/engine/BCCAAEngine.ts:2261:      isTimeBarred = refTs > accrualTs + periodMs;
src/engine/BCCAAEngine.ts:2265:      accrualDate,
src/engine/BCCAAEngine.ts:2271:          ? "Limitation cannot be computed — legally sufficient accrual trigger, limitation period, or reference date is unavailable"
src/engine/BCCAAEngine.ts:2714:        accrualDate: deps.limitation.accrualDate,
src/engine/BCCAAEngine.ts:2831:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: [haltDetail], warnings: [], calculationType: "missing_dates" } },
src/engine/BCCAAEngine.ts:2916:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: ["F0 gate halted"], warnings: [], calculationType: "missing_dates" } },

### 8. Console Statements
src/App.tsx:42:      console.error("Failed to load history:", e);
src/App.tsx:68:      console.error("Failed to save history:", e);
src/App.tsx:134:      console.error("Analysis failed:", err);
src/App.tsx:167:      console.error("Failed to export PDF:", err);
src/App.tsx:189:      console.error("Failed to export DOCX:", err);
src/admin/SuperAdminDashboard.tsx:34:      console.error(e);
src/components/DocumentUploader.tsx:55:      console.warn("Failed to load document history", e);
src/components/DocumentUploader.tsx:65:      console.warn("LocalStorage save error:", e);
src/components/DocumentUploader.tsx:120:          console.warn("PDF worker extraction fallback triggered:", pdfErr);
src/components/DocumentUploader.tsx:156:      console.error("Document processing error:", err);
src/components/LegalAnalysisPanel.tsx:185:      console.error("Failed to export DOCX:", err);
src/components/LegalAnalysisPanel.tsx:202:      console.error("Failed to export PDF:", err);
src/engine/BCCAAEngine.phase1b.test.ts:53:    console.log(
src/engine/BCCAAEngine.phase1b.test.ts:57:    console.log(
src/utils/audit.ts:64:    console.error("Audit logging failed:", e);
src/utils/pdfGeneratorSecure.ts:572:    console.error("PDF generation failed:", error);
src/utils/pdfGeneratorSecure.ts:705:    console.error("Draft PDF export failed:", error);

### 9. TODO / FIXME / HACK / XXX / TEMP
src/auth/LoginPage.tsx:43:      setCustomError("Please enter a valid 11-digit Bangladesh mobile number (+880 1712-XXXXXX).");
src/components/DocumentUploader.tsx:251:Plaintiff seeks Specific Performance of the registered Bainapatra under Section 12 of the Specific Relief Act 1877, alongside a Temporary Injunction under Order XXXIX Rules 1 & 2 CPC to restrain Defendant from transferring the property.`;
src/components/LegalAnalysisPanel.tsx:108:### 1. ORDER XXXIX (39) RULES 1 & 2 CPC TEMPORARY INJUNCTION STRATEGY
src/components/LegalAnalysisPanel.tsx:230:      text: `### PRAYER FOR TEMPORARY & AD-INTERIM INJUNCTION (ORDER XXXIX RULES 1 & 2 CPC)
src/components/LegalAnalysisPanel.tsx:231:That an order of temporary injunction be passed restraining the Defendant(s), their agents, servants, assigns, and representatives from entering upon, changing the physical feature of, cutting trees from, creating third-party charges over, or alienating any portion of the suit schedule property till disposal of the suit.`,
src/components/LegalReliabilityStandardModal.tsx:16:    { step: 2, title: "Fact Normalization", desc: "Deconstruct into immutable atomic propositions with temporal anchors", icon: Database, type: "Processing" },
src/components/LegalReliabilityStandardModal.tsx:17:    { step: 3, title: "Integrity Validation", desc: "F0 Gate temporal, role, vital status, and document conflict checks", icon: ShieldCheck, type: "Gate" },
src/components/MissingEvidenceAlert.tsx:161:      // Check 3: Urgent Third-Party Sale Threat (Temporary Injunction under Order 39)
src/components/MissingEvidenceAlert.tsx:170:          title: "Urgent Temporary Injunction Pleadings Recommended",
src/components/MissingEvidenceAlert.tsx:172:          impact: "Failing to file an application under Order XXXIX Rules 1 & 2 CPC for a temporary injunction will allow the defendant to sell the property to third-party purchasers, creating multi-party litigation complexities and irreversible possession issues."
src/components/StageExplorer.tsx:255:                              <th className="p-1.5 border border-[#E5E1D8]">Temporal</th>
src/components/StageExplorer.tsx:265:                                <td className="p-1.5 font-mono text-[10px]">{af.temporalStatus}</td>
src/components/StageExplorer.tsx:823:                        <span>⚖️ Framed Temporary Injunction Application (Order XXXIX Rules 1 & 2)</span>
src/components/StageExplorer.tsx:850:                            APPLICATION FOR TEMPORARY INJUNCTION UNDER ORDER XXXIX RULES 1 AND 2 READ WITH SECTION 151 OF THE CODE OF CIVIL PROCEDURE, 1908
src/components/StageExplorer.tsx:881:                            a) Grant an order of <strong>Temporary Injunction</strong> restraining the Defendant, her agents, servants, or assigns from alienating, selling, or transferring the undivided suit land or creating any third-party encumbrances until the disposal of the suit; and/or
src/engine/BCCAAEngine.deterministic.test.ts:134:  describe("P1-02 Temporal determinism", () => {
src/engine/BCCAAEngine.phase1.test.ts:1:import { describe, it, expect } from "vitest"; import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from "./BCCAAEngine"; const engine = new BCCAAEngine({ licenseValidator: { validate: async () => ({ valid: true, licenseId: "TEST", issuedTo: "TEST" }) }, factValidationProvider: new NoOpFactValidationProvider() }); function makeRequest(o: any = {}) { return { caseId: o.caseId ?? "P1-TEST", user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any, license: { licenseId: "TEST", issuedTo: "TEST" }, input: { factPattern: o.factPattern ?? "The plaintiff relied on an unregistered bainapatra.", submissionDate: o.submissionDate } }; } describe("P1-01: Semantic determinism", () => { it("SPECIFIC_PERFORMANCE identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01", factPattern: "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); it("death pattern identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01-SC", factPattern: "The plaintiff father died on 10 March 2020. The property is Khatian No. 456.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); }); describe("P1-02: Temporal determinism", () => { it("3-year limitation from 2020 refusal is TIME_BARRED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-02", factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.", submissionDate: "2024-01-15" })); expect(r.stage3.isTimeBarred).toBe(true); expect(r.stage3.accrualDate).toBe("2020-08-20"); }); }); describe("P1-03: Fact extraction", () => { it("UNREGISTERED in atomicFacts", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-REG", factPattern: "The plaintiff relied on an unregistered bainapatra." })); const objs = (r.stage0?.atomicFacts ?? []).map((f: any) => f.object).filter(Boolean); expect(objs).toContain("UNREGISTERED"); }); it("death fact extracted as DECEASED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-DEATH", factPattern: "The plaintiff father died on 10 March 2020." })); const deathFacts = (r.stage0?.atomicFacts ?? []).filter((f: any) => f.predicate === "Vital Status" && f.object === "DECEASED"); expect(deathFacts.length).toBeGreaterThanOrEqual(1); expect(deathFacts[0].subject).toBe("Ancestor"); }); });
src/engine/BCCAAEngine.phase3.test.ts:67:  it("temporal reasoning anchored to submissionDate, not wall-clock", async () => {
src/engine/BCCAAEngine.ts:148:  | "TEMPORALLY_VALID"
src/engine/BCCAAEngine.ts:233:  /** P0-3: Document date provenance for temporal verification. */
src/engine/BCCAAEngine.ts:477:  | "P1_TEMPORAL"
src/engine/BCCAAEngine.ts:1555:    this.extractTemporalFacts(clause, candidates);
src/engine/BCCAAEngine.ts:1704:  // P0-4: Temporal / chronology facts
src/engine/BCCAAEngine.ts:1705:  private extractTemporalFacts(clause: string, candidates: FactCandidate[]): void {
src/engine/BCCAAEngine.ts:2188:      // exist and the dates must be temporally distinct.
src/engine/FactConsistencyGate.ts:58:   * temporal clashes, role mutual exclusions, and evidentiary voids.
src/engine/FactConsistencyGate.ts:132:    // — these are past-temporal qualifiers, not assertions of current living status.
src/engine/FactConsistencyGate.ts:147:          temporalStatus: "PAST",
src/engine/FactConsistencyGate.ts:160:          temporalStatus: "PAST",
src/engine/FactConsistencyGate.ts:175:          temporalStatus: "CURRENT",
src/engine/FactConsistencyGate.ts:188:          temporalStatus: "CURRENT",
src/engine/FactConsistencyGate.ts:203:        temporalStatus: "PAST",
src/engine/FactConsistencyGate.ts:221:        temporalStatus: "PAST",
src/engine/FactConsistencyGate.ts:239:        temporalStatus: "CURRENT",
src/engine/FactConsistencyGate.ts:294:        // @ts-ignore -- TODO: left/right variables undefined; refactor
src/engine/FactConsistencyGate.ts:296:        conflictType: "TEMPORAL_STATUS_CONTRADICTION",
src/engine/FactConsistencyGate.ts:301:          "Direct temporal contradiction: The record simultaneously asserts that the ancestor is deceased (opening statutory inheritance) AND that the ancestor is currently living (holding absolute lifetime ownership without cause of action).",
src/engine/FactConsistencyGate.ts:356:        // @ts-ignore -- TODO: left/right variables undefined; refactor
src/engine/FactConsistencyGate.ts:402:        // @ts-ignore -- TODO: left/right variables undefined; refactor
src/engine/FactConsistencyGate.ts:444:        // @ts-ignore -- TODO: left/right variables undefined; refactor
src/types/types.ts:82:  | "TEMPORALLY_VALID"
src/types/types.ts:138:  temporalStatus?: string;
src/types/types.ts:337:    | "TEMPORAL_STATUS_CONTRADICTION"
src/utils/pdfGeneratorSecure.ts:78:        grid-template-columns: 1fr 1fr;

### 10. Hardcoded Dates
src/engine/BCCAAEngine.deterministic.test.ts:34:      submissionDate: overrides.submissionDate ?? "2024-01-15",
src/engine/BCCAAEngine.deterministic.test.ts:140:          submissionDate: "2024-01-15",
src/engine/BCCAAEngine.deterministic.test.ts:144:      expect(r.stage3.accrualDate).toBe("2020-08-20");
src/engine/BCCAAEngine.deterministic.test.ts:152:          submissionDate: "2024-01-15",
src/engine/BCCAAEngine.deterministic.test.ts:284:          submissionDate: "2024-03-01",
src/engine/BCCAAEngine.deterministic.test.ts:289:      expect(r.stage3.accrualDate).toBe("2020-08-20");
src/engine/BCCAAEngine.deterministic.test.ts:297:          submissionDate: "2024-03-01",
src/engine/BCCAAEngine.deterministic.test.ts:482:      const req = makeRequest({ caseId: "P8-01", factPattern: "", submissionDate: "2024-01-15" });
src/engine/BCCAAEngine.phase1.test.ts:1:import { describe, it, expect } from "vitest"; import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from "./BCCAAEngine"; const engine = new BCCAAEngine({ licenseValidator: { validate: async () => ({ valid: true, licenseId: "TEST", issuedTo: "TEST" }) }, factValidationProvider: new NoOpFactValidationProvider() }); function makeRequest(o: any = {}) { return { caseId: o.caseId ?? "P1-TEST", user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any, license: { licenseId: "TEST", issuedTo: "TEST" }, input: { factPattern: o.factPattern ?? "The plaintiff relied on an unregistered bainapatra.", submissionDate: o.submissionDate } }; } describe("P1-01: Semantic determinism", () => { it("SPECIFIC_PERFORMANCE identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01", factPattern: "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); it("death pattern identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01-SC", factPattern: "The plaintiff father died on 10 March 2020. The property is Khatian No. 456.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); }); describe("P1-02: Temporal determinism", () => { it("3-year limitation from 2020 refusal is TIME_BARRED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-02", factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.", submissionDate: "2024-01-15" })); expect(r.stage3.isTimeBarred).toBe(true); expect(r.stage3.accrualDate).toBe("2020-08-20"); }); }); describe("P1-03: Fact extraction", () => { it("UNREGISTERED in atomicFacts", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-REG", factPattern: "The plaintiff relied on an unregistered bainapatra." })); const objs = (r.stage0?.atomicFacts ?? []).map((f: any) => f.object).filter(Boolean); expect(objs).toContain("UNREGISTERED"); }); it("death fact extracted as DECEASED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-DEATH", factPattern: "The plaintiff father died on 10 March 2020." })); const deathFacts = (r.stage0?.atomicFacts ?? []).filter((f: any) => f.predicate === "Vital Status" && f.object === "DECEASED"); expect(deathFacts.length).toBeGreaterThanOrEqual(1); expect(deathFacts[0].subject).toBe("Ancestor"); }); });
src/engine/BCCAAEngine.phase1b.test.ts:72:      submissionDate: "2024-01-15",
src/engine/BCCAAEngine.phase1b.test.ts:74:    expect(r.stage3.accrualDate).toBe("2025-08-20");
src/engine/BCCAAEngine.phase3.test.ts:72:      submissionDate: "2024-01-15",
src/engine/BCCAAEngine.phase3.test.ts:74:    expect(r.stage3.accrualDate).toBe("2020-08-20");
src/engine/BCCAAEngine.phase3.test.ts:80:      submissionDate: "2024-01-15",
src/engine/BCCAAEngine.ts:1217:    request.input.submissionDate = request.input.submissionDate || "2024-01-01";

### 11. Any Casts
src/engine/BCCAAEngine.deterministic.test.ts:28:    user: { id: "test-id", userId: "test-runner", email: "test.com", name: "Test User", role: "DETERMINISTIC_TEST" as any as any as any, chamberId: "test-chamber" } as any,
src/engine/BCCAAEngine.deterministic.test.ts:40:  const { gateF0, stage0, stage1, stage2, stage3, stage4, stage5, outcome } = response as any;
src/engine/BCCAAEngine.deterministic.test.ts:50:      dispossessionProven: (stage0 as any)?.dispossessionProven,
src/engine/BCCAAEngine.deterministic.test.ts:67:        (p: any) => p.verificationStatus === "VERIFIED_CANONICAL"
src/engine/BCCAAEngine.deterministic.test.ts:92:      timelineProgress: (stage5 as any)?.timelineProgress,
src/engine/BCCAAEngine.deterministic.test.ts:168:        .map((f: any) => f.object)
src/engine/BCCAAEngine.deterministic.test.ts:181:        (f: any) => f.predicate === "Vital Status" && f.object === "DECEASED"
src/engine/BCCAAEngine.deterministic.test.ts:196:        (f: any) =>
src/engine/BCCAAEngine.deterministic.test.ts:356:      const i1 = (r1 as any).stage0?.issues ?? (r1 as any).issues ?? [];
src/engine/BCCAAEngine.deterministic.test.ts:357:      const i2 = (r2 as any).stage0?.issues ?? (r2 as any).issues ?? [];
src/engine/BCCAAEngine.deterministic.test.ts:386:      const m1 = (r1 as any).merits ?? (r1 as any).stage0?.merits ?? [];
src/engine/BCCAAEngine.deterministic.test.ts:387:      const m2 = (r2 as any).merits ?? (r2 as any).stage0?.merits ?? [];
src/engine/BCCAAEngine.deterministic.test.ts:415:      expect(((r.stage5 as any).timelineProgress ?? []).length).toBeGreaterThanOrEqual(0);
src/engine/BCCAAEngine.deterministic.test.ts:428:      const a1 = (r1 as any).appeal ?? (r1 as any).stage0?.appeal ?? [];
src/engine/BCCAAEngine.deterministic.test.ts:429:      const a2 = (r2 as any).appeal ?? (r2 as any).stage0?.appeal ?? [];
src/engine/BCCAAEngine.deterministic.test.ts:467:      expect((r1 as any).auditHash).toBe((r2 as any).auditHash);
src/engine/BCCAAEngine.deterministic.test.ts:468:      expect((r1 as any).auditHash).toBeTruthy();
src/engine/BCCAAEngine.deterministic.test.ts:474:      expect((rA as any).auditHash).not.toBe((rB as any).auditHash);
src/engine/BCCAAEngine.deterministic.test.ts:513:      expect((rUnreg.stage0 as any).bainapatraRegistration).toBe(false);
src/engine/BCCAAEngine.deterministic.test.ts:514:      expect((rReg.stage0 as any).bainapatraRegistration).toBe(true);
src/engine/BCCAAEngine.deterministic.test.ts:515:      expect((rNone.stage0 as any).bainapatraRegistration).toBe("unspecified");
src/engine/BCCAAEngine.phase1.test.ts:1:import { describe, it, expect } from "vitest"; import { BCCAAEngine, canonicalStringify, NoOpFactValidationProvider } from "./BCCAAEngine"; const engine = new BCCAAEngine({ licenseValidator: { validate: async () => ({ valid: true, licenseId: "TEST", issuedTo: "TEST" }) }, factValidationProvider: new NoOpFactValidationProvider() }); function makeRequest(o: any = {}) { return { caseId: o.caseId ?? "P1-TEST", user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any, license: { licenseId: "TEST", issuedTo: "TEST" }, input: { factPattern: o.factPattern ?? "The plaintiff relied on an unregistered bainapatra.", submissionDate: o.submissionDate } }; } describe("P1-01: Semantic determinism", () => { it("SPECIFIC_PERFORMANCE identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01", factPattern: "The plaintiff relied on an unregistered bainapatra. The defendant refused to execute the sale deed on 20 August 2021.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); it("death pattern identical input produces identical output", async () => { const input = makeRequest({ caseId: "P1-01-SC", factPattern: "The plaintiff father died on 10 March 2020. The property is Khatian No. 456.", submissionDate: "2024-01-15" }); const r1 = await engine.analyze(input); const r2 = await engine.analyze(input); expect(canonicalStringify(r1)).toBe(canonicalStringify(r2)); }); }); describe("P1-02: Temporal determinism", () => { it("3-year limitation from 2020 refusal is TIME_BARRED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-02", factPattern: "Bainapatra executed on 15 July 2020. Refusal dated 20 August 2020.", submissionDate: "2024-01-15" })); expect(r.stage3.isTimeBarred).toBe(true); expect(r.stage3.accrualDate).toBe("2020-08-20"); }); }); describe("P1-03: Fact extraction", () => { it("UNREGISTERED in atomicFacts", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-REG", factPattern: "The plaintiff relied on an unregistered bainapatra." })); const objs = (r.stage0?.atomicFacts ?? []).map((f: any) => f.object).filter(Boolean); expect(objs).toContain("UNREGISTERED"); }); it("death fact extracted as DECEASED", async () => { const r = await engine.analyze(makeRequest({ caseId: "P1-03-DEATH", factPattern: "The plaintiff father died on 10 March 2020." })); const deathFacts = (r.stage0?.atomicFacts ?? []).filter((f: any) => f.predicate === "Vital Status" && f.object === "DECEASED"); expect(deathFacts.length).toBeGreaterThanOrEqual(1); expect(deathFacts[0].subject).toBe("Ancestor"); }); });
src/engine/BCCAAEngine.phase1b.test.ts:9:function makeRequest(o: any = {}) {
src/engine/BCCAAEngine.phase1b.test.ts:12:    user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any,
src/engine/BCCAAEngine.phase1b.test.ts:125:    const g = r.stage0.contradictionGraph as any;
src/engine/BCCAAEngine.phase1b.test.ts:139:      (f: any) => f.polarity === "DISPUTED" || f.assertionType === "DENIED"
src/engine/BCCAAEngine.phase1b.test.ts:142:      (a: any) => a.polarity === "DISPUTED" || a.type === "DENIED"
src/engine/BCCAAEngine.phase1b.test.ts:154:    const admittedFacts = r.stage0!.atomicFacts!.filter((f: any) => f.assertionType === "ADMITTED");
src/engine/BCCAAEngine.phase1b.test.ts:156:      (a: any) => a.type === "ADMITTED"
src/engine/BCCAAEngine.phase1b.test.ts:169:      (f: any) => f.truth === "UNKNOWN" || f.confidence === "CANDIDATE"
src/engine/BCCAAEngine.phase1b.test.ts:187:      ...r.stage0!.atomicFacts!.map((f: any) => `${f.predicate} ${f.object} ${f.proposition}`),
src/engine/BCCAAEngine.phase1b.test.ts:188:      ...r.stage0!.propositions!.map((p: any) => String(p)),
src/engine/BCCAAEngine.phase1b.test.ts:219:    r.stage0!.provenance!.forEach((p: any, i: number) => {
src/engine/BCCAAEngine.phase1b.test.ts:234:    r.stage0!.eventTimeline!.forEach((e: any) => {
src/engine/BCCAAEngine.phase2.test.ts:9:function makeRequest(o: any = {}) {
src/engine/BCCAAEngine.phase2.test.ts:12:    user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any,
src/engine/BCCAAEngine.phase2.test.ts:60:    expect(facts.some((f: any) => f.predicate === "Ownership Structure" && f.object === "JOINT")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:70:    expect(facts.some((f: any) => f.predicate === "Possession Status")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:79:    expect(facts.some((f: any) => f.predicate === "Mutation Status")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:88:    expect(facts.some((f: any) => f.predicate === "Area")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:177:    expect(r1.stage0!.atomicFacts!.some((f: any) => f.object === "DECEASED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:178:    expect(r2.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:179:    expect(r1.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(false);
src/engine/BCCAAEngine.phase2.test.ts:180:    expect(r2.stage0!.atomicFacts!.some((f: any) => f.object === "DECEASED")).toBe(false);
src/engine/BCCAAEngine.phase2.test.ts:192:    expect(results[0]!.stage0!.atomicFacts!.some((f: any) => f.object === "REGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:193:    expect(results[1]!.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:194:    expect(results[2]!.stage0!.atomicFacts!.some((f: any) =>
src/engine/BCCAAEngine.phase2.test.ts:209:    expect(results[0]!.stage0!.atomicFacts!.some((f: any) => f.object === "REGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:210:    expect(results[1]!.stage0!.atomicFacts!.some((f: any) => f.object === "UNREGISTERED")).toBe(true);
src/engine/BCCAAEngine.phase2.test.ts:211:    expect(results[2]!.stage0!.atomicFacts!.some((f: any) =>
src/engine/BCCAAEngine.phase2.test.ts:233:    delete (req as any).caseId;
src/engine/BCCAAEngine.phase2.test.ts:242:    delete (req as any).user;
src/engine/BCCAAEngine.phase2.test.ts:285:      submissionDate: undefined as any,
src/engine/BCCAAEngine.phase2.test.ts:313:      caseId: null as any,
src/engine/BCCAAEngine.phase3.test.ts:9:function makeRequest(o: any = {}) {
src/engine/BCCAAEngine.phase3.test.ts:12:    user: { id: "test-id", userId: "test-user", email: "test.com", name: "Test User", role: "TEST" as any as any, chamberId: "test-chamber" } as any,
src/engine/BCCAAEngine.ts:1214:      (request as any).input = { factPattern: "" };
src/engine/BCCAAEngine.ts:3093:          predicateResults: r.predicateResults.map((p: any) => ({
src/engine/BCCAAEngine.ts:3150:    return (rule as any).authorityIds ?? [rule.authority.act];
src/engine/CitationValidator.ts:167:    ratioDecidendi: "During the lifetime of an ancestor, no descendant has any vested, contingent, or justiciable interest in the ancestor's property. The expectation of succession (spes successionis) does not give rise to a maintainable cause of action.",
src/engine/FactConsistencyGate.ts:93:    const atomicFacts: any[] = [];
src/engine/FactConsistencyGate.ts:148:          confidence: 0.95 as any,
src/engine/FactConsistencyGate.ts:161:          confidence: 0.95 as any,
src/engine/FactConsistencyGate.ts:176:          confidence: 0.9 as any,
src/engine/FactConsistencyGate.ts:189:          confidence: 0.9 as any,
src/engine/FactConsistencyGate.ts:204:        confidence: 0.85 as any,
src/engine/FactConsistencyGate.ts:222:        confidence: 0.9 as any,
src/engine/FactConsistencyGate.ts:240:        confidence: 0.75 as any,

## P0 — Fail-Closed Guarantees
### 12. Response Builder — No GREEN on malformed input
src/engine/BCCAAEngine.ts-2281-    const rules = this.ruleRegistry.getClaimElements(claimType, "Bangladesh");
src/engine/BCCAAEngine.ts-2282-    const results: RuleExecutionResult[] = [];
src/engine/BCCAAEngine.ts:2283:    let allSatisfied = true;
src/engine/BCCAAEngine.ts-2284-    const missingElements: string[] = [];
src/engine/BCCAAEngine.ts-2285-    const unknownElements: string[] = [];
--
src/engine/BCCAAEngine.ts-2327-      }
src/engine/BCCAAEngine.ts-2328-    }
src/engine/BCCAAEngine.ts:2329:    const status = fatalFailures.length > 0 ? GateStatus.HALT : allSatisfied ? GateStatus.PASS : GateStatus.INDETERMINATE;
src/engine/BCCAAEngine.ts-2330-    return { status, allSatisfied, missingElements, unknownElements, fatalFailures, ruleExecutionResults: results };
src/engine/BCCAAEngine.ts-2331-  }

### 13. Limitation Engine — Missing accrual handling
src/engine/BCCAAEngine.ts-1092-function toISODate(value: unknown): string {
src/engine/BCCAAEngine.ts-1093-  if (typeof value !== "string") {
src/engine/BCCAAEngine.ts:1094:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-1095-  }
src/engine/BCCAAEngine.ts-1096-
src/engine/BCCAAEngine.ts-1097-  const timestamp = strictDateTimestamp(value);
src/engine/BCCAAEngine.ts-1098-  if (timestamp === null) {
src/engine/BCCAAEngine.ts:1099:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-1100-  }
src/engine/BCCAAEngine.ts-1101-
src/engine/BCCAAEngine.ts-1102-  const d = new Date(timestamp);
src/engine/BCCAAEngine.ts-1103-  if (Number.isNaN(d.getTime())) {
src/engine/BCCAAEngine.ts:1104:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-1105-  }
src/engine/BCCAAEngine.ts-1106-
--
src/engine/BCCAAEngine.ts-2206-          calculationType = "refusal_date";
src/engine/BCCAAEngine.ts-2207-        } else {
src/engine/BCCAAEngine.ts:2208:          accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-2209-          limitationPeriodYears = null;
src/engine/BCCAAEngine.ts:2210:          calculationType = "missing_dates";
src/engine/BCCAAEngine.ts-2211-        }
src/engine/BCCAAEngine.ts-2212-      } else {
src/engine/BCCAAEngine.ts:2213:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-2214-        limitationPeriodYears = null;
src/engine/BCCAAEngine.ts:2215:        calculationType = "missing_dates";
src/engine/BCCAAEngine.ts-2216-      }
src/engine/BCCAAEngine.ts-2217-    }
--
src/engine/BCCAAEngine.ts-2222-        calculationType = "dispossession_date";
src/engine/BCCAAEngine.ts-2223-      } else {
src/engine/BCCAAEngine.ts:2224:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-2225-        limitationPeriodYears = null;
src/engine/BCCAAEngine.ts:2226:        calculationType = "missing_dates";
src/engine/BCCAAEngine.ts-2227-      }
src/engine/BCCAAEngine.ts-2228-    } else if (claimType === "INHERITANCE_CONSULTATION") {
--
src/engine/BCCAAEngine.ts-2232-        calculationType = "death_date";
src/engine/BCCAAEngine.ts-2233-      } else {
src/engine/BCCAAEngine.ts:2234:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-2235-        limitationPeriodYears = null;
src/engine/BCCAAEngine.ts:2236:        calculationType = "missing_dates";
src/engine/BCCAAEngine.ts-2237-      }
src/engine/BCCAAEngine.ts-2238-    } else {
--
src/engine/BCCAAEngine.ts-2241-      // accrual trigger in this engine. Never promote an arbitrary
src/engine/BCCAAEngine.ts-2242-      // chronological event into an authoritative accrual date.
src/engine/BCCAAEngine.ts:2243:      accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-2244-      limitationPeriodYears = null;
src/engine/BCCAAEngine.ts:2245:      calculationType = "missing_dates";
src/engine/BCCAAEngine.ts-2246-    }
src/engine/BCCAAEngine.ts-2247-    // FAIL-CLOSED: limitation must never silently become "not barred"
--
src/engine/BCCAAEngine.ts-2252-    if (
src/engine/BCCAAEngine.ts-2253-      accrualDate &&
src/engine/BCCAAEngine.ts:2254:      accrualDate !== "NOT_EXTRACTED" &&
src/engine/BCCAAEngine.ts-2255-      limitationPeriodYears !== null &&
src/engine/BCCAAEngine.ts-2256-      ctx.referenceDate
--
src/engine/BCCAAEngine.ts-2269-      preliminaryAnalysis:
src/engine/BCCAAEngine.ts-2270-        isTimeBarred === null
src/engine/BCCAAEngine.ts:2271:          ? "Limitation cannot be computed — legally sufficient accrual trigger, limitation period, or reference date is unavailable"
src/engine/BCCAAEngine.ts-2272-          : `Limitation analysis based on ${calculationType}`,
src/engine/BCCAAEngine.ts-2273-    };
--
src/engine/BCCAAEngine.ts-2829-      stage1: { primaryDomain: "UNKNOWN", subsidiaryDomains: [], domainConfidence: "NONE" },
src/engine/BCCAAEngine.ts-2830-      stage2: { relevantSections: [], primaryAct: null, precedents: [], citationValidationAudit: { totalCitations: 0, validatedCitations: 0, unverifiedCitations: 0, auditStatus: "PASS_100_PERCENT_DETERMINISTIC", validationStandard: "100% deterministic canonical registry verification" }, equityPrinciples: [] },
src/engine/BCCAAEngine.ts:2831:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: [haltDetail], warnings: [], calculationType: "missing_dates" } },
src/engine/BCCAAEngine.ts-2832-      stage4: { plaintiffs: [], defendants: [], joinderIssues: "", locusStandiSummary: "" },
src/engine/BCCAAEngine.ts-2833-      stage5: {
--
src/engine/BCCAAEngine.ts-2914-      stage1: { primaryDomain: domain, subsidiaryDomains: [domain], domainConfidence: "NONE" },
src/engine/BCCAAEngine.ts-2915-      stage2: { relevantSections: legislation.relevantSections, primaryAct: legislation.primaryAct, precedents: [], citationValidationAudit: { totalCitations: 0, validatedCitations: 0, unverifiedCitations: 0, auditStatus: "PASS_100_PERCENT_DETERMINISTIC", validationStandard: "100% deterministic canonical registry verification" }, equityPrinciples: [] },
src/engine/BCCAAEngine.ts:2916:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: ["F0 gate halted"], warnings: [], calculationType: "missing_dates" } },
src/engine/BCCAAEngine.ts-2917-      stage4: { plaintiffs: [], defendants: [], joinderIssues: "", locusStandiSummary: "" },
src/engine/BCCAAEngine.ts-2918-      stage5: {

### 14. Fact Truth Values — UNKNOWN preservation
_Manual review required_

## P1 — Determinism & Isolation
_Runtime tests required — see test suite additions below_

## P2 — Deep Legal Pipeline Audit
### 15. Fact Extraction — Provenance (source field presence)
src/engine/BCCAAEngine.ts:276:  source: SourceSpan;
src/engine/BCCAAEngine.ts:1359:          const source: SourceSpan = {
src/engine/BCCAAEngine.ts:1939:        ctx.factRegistry.set(factId, { factId, propositionId, assertionId, proposition: `[AUTO] ${subject} ${predicate} — not mentioned in input`, subject, predicate, object: null, truth: Tristate.UNKNOWN, polarity: AssertionPolarity.UNKNOWN, source: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" }, assertionType: AssertionType.ALLEGED, validationStatus: ValidationStatus.UNVERIFIED, confidence: FactConfidence.CANDIDATE, validation: { extractionStatus: ExtractionStatus.NOT_EXECUTED, sourceStatus: SourceStatus.UNRESOLVED, authenticationStatus: AuthenticationStatus.NOT_EXECUTED, corroborationStatus: CorroborationStatus.NOT_EXECUTED, humanValidationStatus: HumanValidationStatus.NOT_EXECUTED } });
src/engine/BCCAAEngine.ts:2659:      source: f.source,
src/engine/BCCAAEngine.ts:2691:        provenance: atomicFacts.map((f) => ({ factId: f.factId, source: f.source,
src/engine/BCCAAEngine.ts:2903:        atomicFacts: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, propositionId: f.propositionId, assertionId: f.assertionId, proposition: f.proposition, subject: f.subject, predicate: f.predicate, object: f.object, truth: f.truth, polarity: f.polarity, source: f.source, assertionType: f.assertionType, validationStatus: f.validationStatus, confidence: f.confidence, assertedBy: f.assertedBy, eventDate: f.eventDate, normalizedValue: f.normalizedValue, contradicts: f.contradicts, supports: f.supports, disputedProposition: f.disputedProposition, validation: f.validation, provenanceAssertions: f.provenanceAssertions })),
src/engine/BCCAAEngine.ts:2905:        provenance: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, source: f.source,

### 16. Fact ID Generation — Duplicate Risk
src/engine/BCCAAEngine.ts:267:  factId: string;
src/engine/BCCAAEngine.ts:395:  factIds: string[];
src/engine/BCCAAEngine.ts:398:    factId: string;
src/engine/BCCAAEngine.ts:420:    factId: string;
src/engine/BCCAAEngine.ts:474:  | "F0_GATE"
src/engine/BCCAAEngine.ts:1225:        return this.buildPreF0HaltResponse(ctx, caseId, "LICENSE_DENIED", license.reason ?? "unspecified");
src/engine/BCCAAEngine.ts:1229:        return this.buildPreF0HaltResponse(ctx, caseId, "EMPTY_INPUT", "factPattern is required.");
src/engine/BCCAAEngine.ts:1233:        return this.buildPreF0HaltResponse(ctx, caseId, "INPUT_TOO_LARGE", `maximum ${MAX_INPUT_LENGTH} characters.`);
src/engine/BCCAAEngine.ts:1239:      const response = this.buildPreF0HaltResponse(ctx, caseId, "SYSTEM_ERROR", message);
src/engine/BCCAAEngine.ts:1294:        factId: f.factId, subject: f.subject, predicate: f.predicate, object: f.object,
src/engine/BCCAAEngine.ts:1303:      layer: "F0_GATE",
src/engine/BCCAAEngine.ts:1312:      const emptyGate: ElementGateResult = { status: GateStatus.HALT, allSatisfied: false, missingElements: [], unknownElements: [], fatalFailures: ["F0_CRITICAL_CONFLICT"], ruleExecutionResults: [] };
src/engine/BCCAAEngine.ts:1314:      const response = this.buildF0HaltResponse(ctx, request, claimType, f0Gate, synthesis, caseId, domain, legislation);
src/engine/BCCAAEngine.ts:1412:          const factId = shortId("F", ctx.factCounter++);
src/engine/BCCAAEngine.ts:1414:            factId, propositionId, assertionId,
src/engine/BCCAAEngine.ts:1437:          ctx.factRegistry.set(factId, fact);
src/engine/BCCAAEngine.ts:1440:            description: `FACT -> PROPOSITION -> ASSERTION: ${factId}`,
src/engine/BCCAAEngine.ts:1442:            result: `${factId}:${propositionId}:${assertionId}`,
src/engine/BCCAAEngine.ts:1472:      const original = ctx.factRegistry.get(fact.factId);
src/engine/BCCAAEngine.ts:1473:      if (!original) throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: unknown fact ${fact.factId}.`);

### 17. Chronology Handling
src/engine/BCCAAEngine.ts:635:  timelineHash: string;
src/engine/BCCAAEngine.ts:1269:    const chronology = ctx.eventTimeline.map((e) => ({
src/engine/BCCAAEngine.ts:1290:      chronology,
src/engine/BCCAAEngine.ts:1704:  // P0-4: Temporal / chronology facts
src/engine/BCCAAEngine.ts:2170:    timelineValidation: { isValid: boolean; errors: string[]; warnings: string[]; calculationType?: string }
src/engine/BCCAAEngine.ts:2268:      timelineValidation: { isValid: true, errors: [], warnings: [], calculationType },
src/engine/BCCAAEngine.ts:2717:        timelineValidation: deps.limitation.timelineValidation,
src/engine/BCCAAEngine.ts:2822:        chronology: [],
src/engine/BCCAAEngine.ts:2831:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: [haltDetail], warnings: [], calculationType: "missing_dates" } },
src/engine/BCCAAEngine.ts:2866:        timelineProgress: [],
src/engine/BCCAAEngine.ts:2916:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: ["F0 gate halted"], warnings: [], calculationType: "missing_dates" } },
src/engine/BCCAAEngine.ts:2950:      stage11: { timelineProgress: [], proceduralCompliance: false, proceduralNotes: ["F0 gate halted"] },
src/engine/BCCAAEngine.ts:3001:    const timelineHash = canonicalHash(ctx.eventTimeline);
src/engine/BCCAAEngine.ts:3019:      timelineHash,
src/engine/BCCAAEngine.ts:3020:      eventTimelineHash: timelineHash,

### 18. Contradiction Representation
src/engine/BCCAAEngine.ts:83:  CONTRADICTED = "CONTRADICTED",
src/engine/BCCAAEngine.ts:111:  CONTRADICTED = "CONTRADICTED",
src/engine/BCCAAEngine.ts:246:  conflictMode: PredicateConflictMode;
src/engine/BCCAAEngine.ts:283:  contradicts?: string[];
src/engine/BCCAAEngine.ts:396:  conflictDetected?: boolean;
src/engine/BCCAAEngine.ts:418:  conflictDetected: boolean;
src/engine/BCCAAEngine.ts:496:  contradictionGraph: ContradictionEdge[];
src/engine/BCCAAEngine.ts:555:    contradictionGraph: [],
src/engine/BCCAAEngine.ts:721:    CorroborationStatus.CONTRADICTED,
src/engine/BCCAAEngine.ts:728:  CONTRADICTED: new Set([CorroborationStatus.CONTRADICTED]),
src/engine/BCCAAEngine.ts:1267:      : ({ status: Tristate.UNKNOWN, supportingFactIds: [], conflictDetected: false, sameFamilyConflictingFacts: [] } as FactEvaluationResult);
src/engine/BCCAAEngine.ts:1274:      conflictInfo: ctx.contradictionGraph.length > 0
src/engine/BCCAAEngine.ts:1276:            total: ctx.contradictionGraph.length,
src/engine/BCCAAEngine.ts:1277:            critical: ctx.contradictionGraph.filter((edge) => edge.status === "CRITICAL").length,
src/engine/BCCAAEngine.ts:1278:            edges: ctx.contradictionGraph.map((edge) => ({
src/engine/BCCAAEngine.ts:1297:      ctx.contradictionGraph.map((e) => ({
src/engine/BCCAAEngine.ts:1304:      description: `FactConsistencyGate executed. ancestorDeceased: ${ancestorResult.status}. Conflict: ${ancestorResult.conflictDetected}.`,
src/engine/BCCAAEngine.ts:1387:            // a genuine conflict on an identical proposition — collapsing it
src/engine/BCCAAEngine.ts:1389:            // from contradiction detection (which only compares differing
src/engine/BCCAAEngine.ts:1396:            const conflictingAssertion = existingIsDenial !== newIsDenial;

### 19. Evidence Gap Handling
src/engine/BCCAAEngine.ts:231:  /** P0-3: Document type provenance for evidence classification. */
src/engine/BCCAAEngine.ts:1324:    const evidence = this.executeEvidenceRules(ctx);
src/engine/BCCAAEngine.ts:1331:    const executionStatus = this.determineExecutionStatus(standi, pleading, issues, evidence, merits, equity, procedure, appeal);
src/engine/BCCAAEngine.ts:1335:      caseId, domain, legislation, limitation, standi, pleading, issues, evidence, elementGate, merits, equity, procedure, appeal, executionStatus,
src/engine/BCCAAEngine.ts:2460:      missing.push("Registration evidence");
src/engine/BCCAAEngine.ts:2463:      missing.push("Payment evidence");
src/engine/BCCAAEngine.ts:2534:    evidence: { missingEvidence: string[] },
src/engine/BCCAAEngine.ts:2542:    if (issues.framedIssues.length === 0 && evidence.missingEvidence.length === 0 && merits.meritScore >= 80 && equity.equityScore >= 1 && procedure.proceduralCompliance && !appeal.appealable) return "COMPLETED";
src/engine/BCCAAEngine.ts:2618:      recommendations: ["Gather additional evidence for missing elements."],
src/engine/BCCAAEngine.ts:2640:      evidence: ReturnType<BCCAAEngine["executeEvidenceRules"]>;
src/engine/BCCAAEngine.ts:2749:        oralAssertions: deps.evidence.oralAssertions,
src/engine/BCCAAEngine.ts:2750:        documentaryEvidence: deps.evidence.documentaryEvidence,
src/engine/BCCAAEngine.ts:2751:        missingEvidence: deps.evidence.missingEvidence,
src/engine/BCCAAEngine.ts:2844:        evidenceList: [],
src/engine/BCCAAEngine.ts:2929:        evidenceList: [],

## Security / Repository Hygiene
### 20. TypeScript Type Check

### 21. Full Test Suite

[1m[30m[46m RUN [49m[39m[22m [36mv4.1.11 [39m[90mF:/ILRMF RESEARCH/BCCA2offline-main[39m

 [32m✓[39m src/engine/BCCAAEngine.phase2.test.ts [2m([22m[2m28 tests[22m[2m)[22m[32m 194[2mms[22m[39m
 [32m✓[39m src/engine/BCCAAEngine.deterministic.test.ts [2m([22m[2m32 tests[22m[2m | [22m[33m3 skipped[39m[2m)[22m[32m 132[2mms[22m[39m
[90mstdout[2m | src/engine/BCCAAEngine.phase1b.test.ts[2m > [22m[2mP1-04: Missing accrual tests[2m > [22m[2monly refusal date without agreement → falls back to NOT_EXTRACTED
[22m[39mP1-04 refusal-only stage3: {
  "isTimeBarred": null,
  "accrualDate": "NOT_EXTRACTED",
  "limitationPeriodYears": null,
  "calculationType": "missing_dates",
  "timelineValidation": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "calculationType": "missing_dates"
  },
  "preliminaryAnalysis": "Limitation cannot be computed — legally sufficient accrual trigger, limitation period, or reference date is unavailable"
}
P1-04 refusal-only facts: [
  {
    "factId": "F00001",
    "propositionId": "P00001",
    "assertionId": "A00001",
    "proposition": "The defendant refused to execute on 20 August 2020.",
    "subject": "Defendant",
    "predicate": "Refusal Date",
    "object": "20 August 2020",
    "truth": "UNKNOWN",
    "polarity": "POSITIVE",
    "source": {
      "documentId": "INPUT_NARRATIVE",
      "segment": "The defendant refused to execute on 20 August 2020.",
      "paragraph": 1,
      "sourceType": "INPUT_NARRATIVE",
      "extractionMethod": "PATTERN"
    },
    "assertionType": "ALLEGED",
    "validationStatus": "UNVERIFIED",
    "confidence": "CANDIDATE",
    "assertedBy": "DEFENDANT",
    "eventDate": "20 August 2020",
    "normalizedValue": null,
    "validation": {
      "extractionStatus": "EXTRACTED",
      "sourceStatus": "IDENTIFIED",
      "authenticationStatus": "UNAUTHENTICATED",
      "corroborationStatus": "UNCORROBORATED",
      "humanValidationStatus": "NOT_VALIDATED"
    }
  }
]

 [32m✓[39m src/engine/BCCAAEngine.phase1b.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 83[2mms[22m[39m
 [32m✓[39m src/engine/BCCAAEngine.phase3.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 68[2mms[22m[39m
 [32m✓[39m src/engine/BCCAAEngine.phase1.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 50[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m95 passed[39m[22m[2m | [22m[33m3 skipped[39m[90m (98)[39m
[2m   Start at [22m 04:44:32
[2m   Duration [22m 33.66s[2m (transform 1.67s, setup 0ms, import 2.07s, tests 527ms, environment 28.36s)[22m


### 22. Git Diff Whitespace Check

### 23. Build Check

> react-example@0.0.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

[36mvite v6.4.3 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 1941 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                    [39m[1m[2m    0.44 kB[22m[1m[22m[2m │ gzip:   0.30 kB[22m
[2mdist/[22m[35massets/index-Cjz51naE.css     [39m[1m[2m   47.94 kB[22m[1m[22m[2m │ gzip:   9.00 kB[22m
[2mdist/[22m[36massets/purify.es-CYR4BTuT.js  [39m[1m[2m   28.93 kB[22m[1m[22m[2m │ gzip:  11.14 kB[22m
[2mdist/[22m[36massets/index.es-BMHSU6l4.js   [39m[1m[2m  159.91 kB[22m[1m[22m[2m │ gzip:  53.60 kB[22m
[2mdist/[22m[36massets/index-Dsj3hpG4.js      [39m[1m[33m1,955.46 kB[39m[22m[2m │ gzip: 564.31 kB[22m
[33m
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 35.52s[39m

  dist\server.cjs      2.2kb
  dist\server.cjs.map  1.8kb

Done in 144ms

## Audit Complete
Review AUDIT_FINDINGS.md for findings.
