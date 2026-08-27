# BCCAA P0/P1/P2 Full Audit Report
Date: 2026-08-28T04:53:19+06:00
Commit: f920975

## P0 — Engine Correctness
### P0.1 Null/Undefined Boundary Risks (non-optional-chained access)
src/engine/BCCAAEngine.ts:750:  if (!EXTRACTION_SATISFIES[String(req.extractionRequired)].has(fact.validation.extractionStatus)) {
src/engine/BCCAAEngine.ts:753:  if (!SOURCE_SATISFIES[req.sourceRequired].has(fact.validation.sourceStatus)) {
src/engine/BCCAAEngine.ts:756:  if (!AUTH_SATISFIES[req.authenticationRequired].has(fact.validation.authenticationStatus)) {
src/engine/BCCAAEngine.ts:759:  if (!CORR_SATISFIES[req.corroborationRequired].has(fact.validation.corroborationStatus)) {
src/engine/BCCAAEngine.ts:762:  if (!HV_SATISFIES[req.humanValidationRequired].has(fact.validation.humanValidationStatus)) {
src/engine/BCCAAEngine.ts:997:        ...f.validation,
src/engine/BCCAAEngine.ts:1219:    request.input.submissionDate = request.input.submissionDate || new Date().toISOString().slice(0, 10);
src/engine/BCCAAEngine.ts:1224:      const license = await this.licenseValidator.validate(
src/engine/BCCAAEngine.ts:1278:      factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
src/engine/BCCAAEngine.ts:1468:    const validated = await this.factValidationProvider.validateFacts({
src/engine/BCCAAEngine.ts:1491:      const providerAllowsPromotion = this.factValidationProvider.setsTruth === true;
src/engine/BCCAAEngine.ts:1995:            left.contradicts.push(right.factId);
src/engine/BCCAAEngine.ts:1996:            right.contradicts.push(left.factId);
src/engine/BCCAAEngine.ts:2085:      (f) => f.subject.toUpperCase() === subjectUpper && f.predicate.toUpperCase() === predicateUpper,
src/engine/BCCAAEngine.ts:2109:          sourceStatus: fact.validation.sourceStatus,
src/engine/BCCAAEngine.ts:2110:          authenticationStatus: fact.validation.authenticationStatus,
src/engine/BCCAAEngine.ts:2111:          corroborationStatus: fact.validation.corroborationStatus,
src/engine/BCCAAEngine.ts:2112:          humanValidationStatus: fact.validation.humanValidationStatus,
src/engine/BCCAAEngine.ts:2119:          sourceStatus: fact.validation.sourceStatus,
src/engine/BCCAAEngine.ts:2120:          authenticationStatus: fact.validation.authenticationStatus,
src/engine/BCCAAEngine.ts:2121:          corroborationStatus: fact.validation.corroborationStatus,
src/engine/BCCAAEngine.ts:2122:          humanValidationStatus: fact.validation.humanValidationStatus,
src/engine/BCCAAEngine.ts:2127:          sourceStatus: fact.validation.sourceStatus,
src/engine/BCCAAEngine.ts:2128:          authenticationStatus: fact.validation.authenticationStatus,
src/engine/BCCAAEngine.ts:2129:          corroborationStatus: fact.validation.corroborationStatus,
src/engine/BCCAAEngine.ts:2130:          humanValidationStatus: fact.validation.humanValidationStatus,
src/engine/BCCAAEngine.ts:2163:    return this.ruleRegistry.getLegislationMapping(claimType);
src/engine/BCCAAEngine.ts:2286:    const rules = this.ruleRegistry.getClaimElements(claimType, "Bangladesh");
src/engine/BCCAAEngine.ts:2315:        authorityIds: [rule.authority.act],
src/engine/BCCAAEngine.ts:2408:    if (elementGate.missingElements.length > 0) {
src/engine/BCCAAEngine.ts:2409:      grounds.push(`Missing elements: ${elementGate.missingElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2411:    if (elementGate.unknownElements.length > 0) {
src/engine/BCCAAEngine.ts:2412:      grounds.push(`Unknown elements: ${elementGate.unknownElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2429:    if (elementGate.missingElements.includes("SP-ELEMENT-REGISTRATION")) {
src/engine/BCCAAEngine.ts:2432:    if (elementGate.missingElements.includes("SP-ELEMENT-DEPOSIT")) {
src/engine/BCCAAEngine.ts:2435:    if (elementGate.missingElements.includes("SUCCESSION-DEATH-ELEMENT")) {
src/engine/BCCAAEngine.ts:2438:    if (elementGate.missingElements.includes("DP-ELEMENT-TITLE")) {
src/engine/BCCAAEngine.ts:2441:    if (elementGate.missingElements.includes("DP-ELEMENT-POSSESSION")) {
src/engine/BCCAAEngine.ts:2481:    const total = elementGate.ruleExecutionResults.length;
src/engine/BCCAAEngine.ts:2482:    const satisfied = elementGate.ruleExecutionResults.filter((r) => r.status === "SATISFIED").length;
src/engine/BCCAAEngine.ts:2545:    if (standi.plaintiffs.length === 0 || standi.defendants.length === 0) return "BLOCKED";
src/engine/BCCAAEngine.ts:2546:    if (pleading.groundsForRejection.length > 0) return "PARTIAL";
src/engine/BCCAAEngine.ts:2547:    if (issues.framedIssues.length === 0 && evidence.missingEvidence.length === 0 && merits.meritScore >= 80 && equity.equityScore >= 1 && procedure.proceduralCompliance && !appeal.appealable) return "COMPLETED";
src/engine/BCCAAEngine.ts:2574:    const elementSummary = elementGate.ruleExecutionResults.map((r) => ({
src/engine/BCCAAEngine.ts:2597:        humanReviewReason: elementGate.fatalFailures.join("; "),
src/engine/BCCAAEngine.ts:2620:      humanReviewReason: `Missing: ${elementGate.missingElements.join(", ")}; Unknown: ${elementGate.unknownElements.join(", ")}`,
src/engine/BCCAAEngine.ts:2680:      userId: request.user.id,
src/engine/BCCAAEngine.ts:2681:      licenseId: request.license.licenseId,
src/engine/BCCAAEngine.ts:2697:    sourceType: f.source.extractionMethod, extractionMethod: f.source.extractionMethod })),
src/engine/BCCAAEngine.ts:2711:        relevantSections: deps.legislation.relevantSections,

### P0.2 Array Methods in Engine
src/engine/BCCAAEngine.ts:588:  if (Array.isArray(value)) return value.map(canonicalize);
src/engine/BCCAAEngine.ts:992:    return facts.map((f) => ({
src/engine/BCCAAEngine.ts:1011:    return facts.map((f) => {
src/engine/BCCAAEngine.ts:1067:    const p = s.split(/[-\/]/); [y, m, d] = p.map(Number); m -= 1;
src/engine/BCCAAEngine.ts:1075:  if ([y, m, d].some(isNaN) || y < 1 || m < 0 || m > 11 || d < 1 || d > 31) return null;
src/engine/BCCAAEngine.ts:1274:    const chronology = ctx.eventTimeline.map((e) => ({
src/engine/BCCAAEngine.ts:1278:      factualSource: e.sourceFactIds.join(", ") || "INPUT_NARRATIVE",
src/engine/BCCAAEngine.ts:1282:            critical: ctx.contradictionGraph.filter((edge) => edge.status === "CRITICAL").length,
src/engine/BCCAAEngine.ts:1283:            edges: ctx.contradictionGraph.map((edge) => ({
src/engine/BCCAAEngine.ts:1298:      Array.from(ctx.factRegistry.values()).map((f) => ({
src/engine/BCCAAEngine.ts:1302:      ctx.contradictionGraph.map((e) => ({
src/engine/BCCAAEngine.ts:1384:          const existingFact = Array.from(ctx.factRegistry.values()).find(
src/engine/BCCAAEngine.ts:1457:    const existing = Array.from(ctx.propositionRegistry.values()).find((p) => p.canonicalKey === canonicalKey);
src/engine/BCCAAEngine.ts:1534:    const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
src/engine/BCCAAEngine.ts:1535:    return sentences.map((s) => {
src/engine/BCCAAEngine.ts:1546:      .map((x) => x.trim()).filter(Boolean);
src/engine/BCCAAEngine.ts:1661:    const hasSemantic = candidates.some((c) => c.predicate !== "Quantum Amount" && /^(Tk\.?|taka|bdt)/i.test(c.object || ""));
src/engine/BCCAAEngine.ts:1928:    const existingKeys = new Set(Array.from(ctx.factRegistry.values()).map((f) => `${f.subject}|${f.predicate}`.toUpperCase()));
src/engine/BCCAAEngine.ts:2004:    const criticalEdges = ctx.contradictionGraph.filter((e) => e.status === "CRITICAL");
src/engine/BCCAAEngine.ts:2009:        dependsOnFacts: criticalEdges.flatMap((e) => [e.leftFactId, e.rightFactId]),
src/engine/BCCAAEngine.ts:2011:        result: `EDGES:[${criticalEdges.map((e) => e.edgeId).join(",")}]`,
src/engine/BCCAAEngine.ts:2022:    const factsWithDates = Array.from(ctx.factRegistry.values()).filter(
src/engine/BCCAAEngine.ts:2084:    const familyFacts = Array.from(ctx.factRegistry.values()).filter(
src/engine/BCCAAEngine.ts:2088:      .filter((f) => f.truth === Tristate.TRUE)
src/engine/BCCAAEngine.ts:2089:      .map((f) => ({ factId: f.factId, object: f.object, truth: f.truth }));
src/engine/BCCAAEngine.ts:2090:    const conflictDetected = sameFamilyConflictingFacts.length > 1 && new Set(sameFamilyConflictingFacts.map((f) => f.object)).size > 1;
src/engine/BCCAAEngine.ts:2092:      ? familyFacts.filter((f) => f.object?.toUpperCase() === objectFilter.toUpperCase())
src/engine/BCCAAEngine.ts:2179:    const dates = facts.filter((f) => f.eventDate && isStrictDate(f.eventDate)).map((f) => f.eventDate!);
src/engine/BCCAAEngine.ts:2180:    const refusalDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Refusal Date"));
src/engine/BCCAAEngine.ts:2181:    const dispossessionDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Dispossession Date"));
src/engine/BCCAAEngine.ts:2182:    const demandDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Demand Date"));
src/engine/BCCAAEngine.ts:2183:    const deathDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Vital Status" && f.object === "DECEASED"));
src/engine/BCCAAEngine.ts:2184:    const executionDate = dates.find((d) => facts.some((f) => f.eventDate === d && f.predicate === "Execution Date"));
src/engine/BCCAAEngine.ts:2325:        if (predicateResults.some((pr) => pr.status === "UNKNOWN")) {
src/engine/BCCAAEngine.ts:2353:    const partyFacts = Array.from(ctx.factRegistry.values()).filter(
src/engine/BCCAAEngine.ts:2359:      .filter((f) => f.subject === "Plaintiff" && f.predicate === "Party Identity" && f.object)
src/engine/BCCAAEngine.ts:2360:      .map((f) => f.object!)
src/engine/BCCAAEngine.ts:2361:      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe while preserving order
src/engine/BCCAAEngine.ts:2365:      .filter((f) => f.subject === "Defendant" && f.predicate === "Party Identity" && f.object)
src/engine/BCCAAEngine.ts:2366:      .map((f) => f.object!)
src/engine/BCCAAEngine.ts:2367:      .filter((v, i, arr) => arr.indexOf(v) === i);
src/engine/BCCAAEngine.ts:2371:      .filter((f) => f.predicate === "Party Role" && f.object === "PLAINTIFF" && f.object)
src/engine/BCCAAEngine.ts:2372:      .map((f) => f.subject)
src/engine/BCCAAEngine.ts:2373:      .filter((v, i, arr) => arr.indexOf(v) === i);
src/engine/BCCAAEngine.ts:2376:      .filter((f) => f.predicate === "Party Role" && f.object === "DEFENDANT" && f.object)
src/engine/BCCAAEngine.ts:2377:      .map((f) => f.subject)
src/engine/BCCAAEngine.ts:2378:      .filter((v, i, arr) => arr.indexOf(v) === i);
src/engine/BCCAAEngine.ts:2389:      ? `Plaintiff(s): ${plaintiffs.join(", ")}; Defendant(s): ${defendants.join(", ")}`
src/engine/BCCAAEngine.ts:2409:      grounds.push(`Missing elements: ${elementGate.missingElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2412:      grounds.push(`Unknown elements: ${elementGate.unknownElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2445:      .filter((e) => e.status === "CRITICAL")
src/engine/BCCAAEngine.ts:2446:      .map((e) => `Critical contradiction on ${e.propositionKey}`);
src/engine/BCCAAEngine.ts:2461:    const oral = facts.filter((f) => f.assertionType === AssertionType.PARTY_NARRATIVE || f.assertionType === AssertionType.ALLEGED).length;
src/engine/BCCAAEngine.ts:2462:    const documentary = facts.filter((f) => f.assertionType === AssertionType.DOCUMENTARY_FACT).length;
src/engine/BCCAAEngine.ts:2464:    if (!facts.some((f) => f.predicate === "Registration Status")) {
src/engine/BCCAAEngine.ts:2467:    if (!facts.some((f) => f.predicate === "Payment Status")) {
src/engine/BCCAAEngine.ts:2482:    const satisfied = elementGate.ruleExecutionResults.filter((r) => r.status === "SATISFIED").length;
src/engine/BCCAAEngine.ts:2574:    const elementSummary = elementGate.ruleExecutionResults.map((r) => ({
src/engine/BCCAAEngine.ts:2597:        humanReviewReason: elementGate.fatalFailures.join("; "),
src/engine/BCCAAEngine.ts:2620:      humanReviewReason: `Missing: ${elementGate.missingElements.join(", ")}; Unknown: ${elementGate.unknownElements.join(", ")}`,
src/engine/BCCAAEngine.ts:2654:    const atomicFacts = Array.from(ctx.factRegistry.values()).map((f) => ({
src/engine/BCCAAEngine.ts:2695:        propositions: atomicFacts.map((f) => f.proposition),
src/engine/BCCAAEngine.ts:2696:        provenance: atomicFacts.map((f) => ({ factId: f.factId, source: f.source,
src/engine/BCCAAEngine.ts:2703:        quantumFacts: atomicFacts.filter((f) => f.predicate.toLowerCase().includes("amount") || f.predicate.toLowerCase().includes("consideration") || f.predicate.toLowerCase().includes("deposit") || f.predicate.toLowerCase().includes("valuation")).map((f) => `${f.predicate}: ${f.object ?? "N/A"}`),
src/engine/BCCAAEngine.ts:2726:        plaintiffs: deps.standi.plaintiffs.map((name: string) => ({
src/engine/BCCAAEngine.ts:2732:        defendants: deps.standi.defendants.map((name: string) => ({
src/engine/BCCAAEngine.ts:2908:        atomicFacts: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, propositionId: f.propositionId, assertionId: f.assertionId, proposition: f.proposition, subject: f.subject, predicate: f.predicate, object: f.object, truth: f.truth, polarity: f.polarity, source: f.source, assertionType: f.assertionType, validationStatus: f.validationStatus, confidence: f.confidence, assertedBy: f.assertedBy, eventDate: f.eventDate, normalizedValue: f.normalizedValue, contradicts: f.contradicts, supports: f.supports, disputedProposition: f.disputedProposition, validation: f.validation, provenanceAssertions: f.provenanceAssertions })),
src/engine/BCCAAEngine.ts:2909:        propositions: Array.from(ctx.factRegistry.values()).map((f) => f.proposition),
src/engine/BCCAAEngine.ts:2910:        provenance: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, source: f.source,
src/engine/BCCAAEngine.ts:3005:    const factRegistryHash = canonicalHash(facts.map((f) => ({ factId: f.factId, subject: f.subject, predicate: f.predicate, object: f.object, truth: f.truth, eventDate: f.eventDate, normalizedValue: f.normalizedValue })));
src/engine/BCCAAEngine.ts:3009:    const extractionHash = canonicalHash(facts.map((f) => f.proposition));
src/engine/BCCAAEngine.ts:3054:        atomicFacts: (response.stage0?.atomicFacts ?? []).map((f) => ({
src/engine/BCCAAEngine.ts:3064:        contradictionGraph: (response.stage0?.contradictionGraph ?? []).map((e) => ({
src/engine/BCCAAEngine.ts:3071:        eventTimeline: (response.stage0?.eventTimeline ?? []).map((e) => ({
src/engine/BCCAAEngine.ts:3095:        ruleExecutionResults: (response.stage8?.ruleExecutionResults ?? []).map((r) => ({
src/engine/BCCAAEngine.ts:3098:          predicateResults: r.predicateResults.map((p: any) => ({
src/engine/BCCAAEngine.ts:3132:    const fact = Array.from(ctx.factRegistry.values()).find(

### P0.3 Nested Request Access
src/engine/BCCAAEngine.ts:1216:    request.input.factPattern = String(request.input.factPattern ?? "").trim();
src/engine/BCCAAEngine.ts:1219:    request.input.submissionDate = request.input.submissionDate || new Date().toISOString().slice(0, 10);
src/engine/BCCAAEngine.ts:1236:      if ((request.input.factPattern ?? "").length > MAX_INPUT_LENGTH) {
src/engine/BCCAAEngine.ts:2680:      userId: request.user.id,
src/engine/BCCAAEngine.ts:2681:      licenseId: request.license.licenseId,
src/engine/BCCAAEngine.ts:2894:      userId: request.user.id,
src/engine/BCCAAEngine.ts:2895:      licenseId: request.license.licenseId,
src/engine/BCCAAEngine.ts:3008:    const rawInputHash = canonicalHash(request.input.factPattern);
src/engine/BCCAAEngine.ts:3035:      analyzedByUserId: request.user.id,

### P0.4 JSON.parse(JSON.stringify())
src/engine/BCCAAEngine.ts:1208:    request = JSON.parse(JSON.stringify(request));

### P0.5 Mutating Operations
src/engine/BCCAAEngine.ts:571:  ctx.executionTrace.push({ stepId, ...step });
src/engine/BCCAAEngine.ts:591:    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
src/engine/BCCAAEngine.ts:1410:              existingFact.provenanceAssertions = Array.from(merged).sort();
src/engine/BCCAAEngine.ts:1525:        protectedMarks.push(match);
src/engine/BCCAAEngine.ts:1531:      protectedMarks.push(`${num}.`);
src/engine/BCCAAEngine.ts:1576:        candidates.push({ subject: "Plaintiff", predicate: "Party Identity", object: name });
src/engine/BCCAAEngine.ts:1577:        candidates.push({ subject: name, predicate: "Party Role", object: "PLAINTIFF" });
src/engine/BCCAAEngine.ts:1587:        candidates.push({ subject: "Defendant", predicate: "Party Identity", object: name });
src/engine/BCCAAEngine.ts:1588:        candidates.push({ subject: name, predicate: "Party Role", object: "DEFENDANT" });
src/engine/BCCAAEngine.ts:1596:      candidates.push({ subject: name, predicate: "Capacity", object: role });
src/engine/BCCAAEngine.ts:1609:      candidates.push({ subject: "Bainapatra", predicate: "Execution Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1613:      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "REGISTERED" });
src/engine/BCCAAEngine.ts:1618:      candidates.push({ subject: "Bainapatra", predicate: "Registration Status", object: "UNREGISTERED" });
src/engine/BCCAAEngine.ts:1623:      candidates.push({ subject: "Registration", predicate: "Case Number", object: regCaseMatch[1].trim() });
src/engine/BCCAAEngine.ts:1627:      candidates.push({ subject: "Registration", predicate: "Statutory Basis", object: "Section 17A" });
src/engine/BCCAAEngine.ts:1631:      candidates.push({ subject: "Specific Relief", predicate: "Statutory Basis", object: "Section 21A" });
src/engine/BCCAAEngine.ts:1655:          candidates.push({ subject: p.subject, predicate: p.predicate, object: `Tk. ${m[1]}`, normalizedValue: val });
src/engine/BCCAAEngine.ts:1667:          candidates.push({ subject: "Claim", predicate: "Quantum Amount", object: `Tk. ${mm[1]}`, normalizedValue: val });
src/engine/BCCAAEngine.ts:1678:      candidates.push({ subject: "Property", predicate: "Area", object: areaMatch[0] });
src/engine/BCCAAEngine.ts:1682:      candidates.push({ subject: "Property", predicate: "Ownership Structure", object: "JOINT" });
src/engine/BCCAAEngine.ts:1686:      candidates.push({ subject: "Property", predicate: "Mutation Status", object: "EXCLUSIVE_MUTATION" });
src/engine/BCCAAEngine.ts:1688:      candidates.push({ subject: "Property", predicate: "Mutation Status", object: "MUTATED" });
src/engine/BCCAAEngine.ts:1696:      candidates.push({ subject: "Treasury Deposit", predicate: "Payment Status", object: "DEPOSITED" });
src/engine/BCCAAEngine.ts:1700:        candidates.push({ subject: "Treasury Deposit", predicate: "Challan Number", object: challanMatch[1].trim() });
src/engine/BCCAAEngine.ts:1705:      candidates.push({ subject: "Plaintiff", predicate: "Title Status", object: "REGISTERED_OWNER" });
src/engine/BCCAAEngine.ts:1715:      candidates.push({ subject: "Defendant", predicate: "Refusal Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1717:      candidates.push({ subject: "Defendant", predicate: "Refusal Date", object: null });
src/engine/BCCAAEngine.ts:1724:      candidates.push({ subject: "Plaintiff", predicate: "Demand Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1731:      candidates.push({ subject: "Contract", predicate: "Performance Deadline", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1739:        candidates.push({ subject: "Ancestor", predicate: "Disowning Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1748:        candidates.push({ subject: "Media", predicate: "Publication Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1757:        candidates.push({ subject: "Heirship", predicate: "Certificate Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1766:        candidates.push({ subject: "Spouse", predicate: "Predeceased Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1785:        candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED", eventDate: date });
src/engine/BCCAAEngine.ts:1787:        candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED" });
src/engine/BCCAAEngine.ts:1792:      candidates.push({ subject: "Ancestor", predicate: "Vital Status", object: "ALIVE" });
src/engine/BCCAAEngine.ts:1796:      candidates.push({ subject: "Ancestor", predicate: "Succession Type", object: "INTESTATE" });
src/engine/BCCAAEngine.ts:1800:      candidates.push({ subject: "Ancestor", predicate: "Disowning Declaration", object: "DECLARED" });
src/engine/BCCAAEngine.ts:1812:      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "DISPOSSESSED" });
src/engine/BCCAAEngine.ts:1817:        candidates.push({ subject: "Plaintiff", predicate: "Dispossession Date", object: date, eventDate: date });
src/engine/BCCAAEngine.ts:1821:      candidates.push({ subject: "Plaintiff", predicate: "Possession Status", object: "IN_POSSESSION" });
src/engine/BCCAAEngine.ts:1825:      candidates.push({ subject: "Defendant", predicate: "Construction Status", object: "UNAUTHORIZED" });
src/engine/BCCAAEngine.ts:1931:      requiredPairs.push(["Bainapatra", "Registration Status"], ["Treasury Deposit", "Payment Status"], ["Bainapatra", "Execution Date"]);
src/engine/BCCAAEngine.ts:1933:      requiredPairs.push(["Plaintiff", "Title Status"], ["Plaintiff", "Possession Status"]);
src/engine/BCCAAEngine.ts:1935:      requiredPairs.push(["Ancestor", "Vital Status"], ["Ancestor", "Succession Type"], ["Property", "Ownership Structure"], ["Property", "Mutation Status"]);
src/engine/BCCAAEngine.ts:1955:      familyMap.get(familyKey)!.push(fact);
src/engine/BCCAAEngine.ts:1992:            ctx.contradictionGraph.push(edge);
src/engine/BCCAAEngine.ts:1995:            left.contradicts.push(right.factId);
src/engine/BCCAAEngine.ts:1996:            right.contradicts.push(left.factId);
src/engine/BCCAAEngine.ts:2013:      ctx.warnings.push(`CRITICAL: ${criticalEdges.length} contradiction edge(s) detected. F0 gate will evaluate.`);
src/engine/BCCAAEngine.ts:2025:    factsWithDates.sort((a, b) => strictDateTimestamp(a.eventDate!) - strictDateTimestamp(b.eventDate!));
src/engine/BCCAAEngine.ts:2031:      ctx.eventTimeline.push({
src/engine/BCCAAEngine.ts:2040:      ctx.eventTimeline.push({
src/engine/BCCAAEngine.ts:2107:        supportingFactIds.push(fact.factId);
src/engine/BCCAAEngine.ts:2117:        supportingFactIds.push(fact.factId);
src/engine/BCCAAEngine.ts:2125:        supportingFactIds.push(fact.factId);
src/engine/BCCAAEngine.ts:2301:        predicateResults.push({
src/engine/BCCAAEngine.ts:2321:      results.push(ruleResult);
src/engine/BCCAAEngine.ts:2326:          unknownElements.push(rule.ruleId);
src/engine/BCCAAEngine.ts:2328:          missingElements.push(rule.ruleId);
src/engine/BCCAAEngine.ts:2331:        fatalFailures.push(rule.ruleId);
src/engine/BCCAAEngine.ts:2409:      grounds.push(`Missing elements: ${elementGate.missingElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2412:      grounds.push(`Unknown elements: ${elementGate.unknownElements.join(", ")}`);
src/engine/BCCAAEngine.ts:2414:    checklist.push("Plaint filed");
src/engine/BCCAAEngine.ts:2415:    checklist.push("Written statement filed");
src/engine/BCCAAEngine.ts:2430:      issues.push("Whether the bainapatra is registered");
src/engine/BCCAAEngine.ts:2433:      issues.push("Whether the balance consideration was deposited");
src/engine/BCCAAEngine.ts:2436:      issues.push("Whether the ancestor is deceased");
src/engine/BCCAAEngine.ts:2439:      issues.push("Whether the plaintiff holds registered title");
src/engine/BCCAAEngine.ts:2442:      issues.push("Whether the plaintiff was dispossessed");
src/engine/BCCAAEngine.ts:2447:    issues.push(...contradictionIssues);
src/engine/BCCAAEngine.ts:2465:      missing.push("Registration evidence");
src/engine/BCCAAEngine.ts:2468:      missing.push("Payment evidence");
src/engine/BCCAAEngine.ts:2501:      principles.push("Clean hands — plaintiff has satisfied all legal elements.");
src/engine/BCCAAEngine.ts:2504:      principles.push("No material contradictions — equitable relief favored.");

### P0.6 UNKNOWN → FALSE Conversion
src/engine/BCCAAEngine.ts:1272:      : ({ status: Tristate.UNKNOWN, supportingFactIds: [], conflictDetected: false, sameFamilyConflictingFacts: [] } as FactEvaluationResult);

### P0.7 Fallback / NOT_EXTRACTED / Hardcoded
src/engine/BCCAAEngine.ts:1094:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:1099:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:1104:    return "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:1660:    // Generic quantum fallback (only if no semantic match)
src/engine/BCCAAEngine.ts:2213:          accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2218:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2229:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2239:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2248:      accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts:2259:      accrualDate !== "NOT_EXTRACTED" &&
src/engine/BCCAAEngine.ts:2836:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: [haltDetail], warnings: [], calculationType: "missing_dates" } },
src/engine/BCCAAEngine.ts:2921:      stage3: { isTimeBarred: false, accrualDate: "NOT_EXTRACTED", preliminaryAnalysis: "Limitation cannot be computed — F0 gate halted", limitationPeriodYears: null, calculationType: "missing_dates", timelineValidation: { isValid: false, errors: ["F0 gate halted"], warnings: [], calculationType: "missing_dates" } },

### P0.8 Console Statements
_None_

### P0.9 TODO/FIXME/HACK/XXX
_None_

### P0.10 Any Casts
src/engine/BCCAAEngine.ts:1214:      (request as any).input = { factPattern: "" };
src/engine/BCCAAEngine.ts:3098:          predicateResults: r.predicateResults.map((p: any) => ({
src/engine/BCCAAEngine.ts:3155:    return (rule as any).authorityIds ?? [rule.authority.act];

### P0.11 Hardcoded Dates
_None_

## P0 — Fail-Closed Guarantees
### P0.12 GREEN verdict on malformed input
src/engine/BCCAAEngine.ts-2287-    const results: RuleExecutionResult[] = [];
src/engine/BCCAAEngine.ts:2288:    let allSatisfied = true;
src/engine/BCCAAEngine.ts-2289-    const missingElements: string[] = [];
--
src/engine/BCCAAEngine.ts-2333-    }
src/engine/BCCAAEngine.ts:2334:    const status = fatalFailures.length > 0 ? GateStatus.HALT : allSatisfied ? GateStatus.PASS : GateStatus.INDETERMINATE;
src/engine/BCCAAEngine.ts-2335-    return { status, allSatisfied, missingElements, unknownElements, fatalFailures, ruleExecutionResults: results };

### P0.13 Missing accrual → NOT_EXTRACTED
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
src/engine/BCCAAEngine.ts-2211-          calculationType = "refusal_date";
src/engine/BCCAAEngine.ts-2212-        } else {
src/engine/BCCAAEngine.ts:2213:          accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-2214-          limitationPeriodYears = null;
src/engine/BCCAAEngine.ts:2215:          calculationType = "missing_dates";
src/engine/BCCAAEngine.ts-2216-        }
src/engine/BCCAAEngine.ts-2217-      } else {
src/engine/BCCAAEngine.ts:2218:        accrualDate = "NOT_EXTRACTED";
src/engine/BCCAAEngine.ts-2219-        limitationPeriodYears = null;
src/engine/BCCAAEngine.ts:2220:        calculationType = "missing_dates";
src/engine/BCCAAEngine.ts-2221-      }
src/engine/BCCAAEngine.ts-2222-    }
--
src/engine/BCCAAEngine.ts-2227-        calculationType = "dispossession_date";

### P0.14 Unknown fact preservation
src/engine/BCCAAEngine.ts:994:      truth: Tristate.UNKNOWN,
src/engine/BCCAAEngine.ts:1013:      // be silently promoted to TRUE just because its truth was UNKNOWN — that
src/engine/BCCAAEngine.ts:1022:        truth: !isNonPromotable && f.truth === Tristate.UNKNOWN ? Tristate.TRUE : f.truth,
src/engine/BCCAAEngine.ts:1424:            truth: Tristate.UNKNOWN,
src/engine/BCCAAEngine.ts:1493:        original.truth === Tristate.UNKNOWN &&
src/engine/BCCAAEngine.ts:1497:        original.truth === Tristate.UNKNOWN &&
src/engine/BCCAAEngine.ts:1498:        fact.truth !== Tristate.UNKNOWN &&
src/engine/BCCAAEngine.ts:1501:        throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: fact ${fact.factId} truth silently mutated from UNKNOWN to ${fact.truth} by validator.`);
src/engine/BCCAAEngine.ts:1944:        ctx.factRegistry.set(factId, { factId, propositionId, assertionId, proposition: `[AUTO] ${subject} ${predicate} — not mentioned in input`, subject, predicate, object: null, truth: Tristate.UNKNOWN, polarity: AssertionPolarity.UNKNOWN, source: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" }, assertionType: AssertionType.INFERRED, validationStatus: ValidationStatus.UNVERIFIED, confidence: FactConfidence.CANDIDATE, validation: { extractionStatus: ExtractionStatus.NOT_EXECUTED, sourceStatus: SourceStatus.UNRESOLVED, authenticationStatus: AuthenticationStatus.NOT_EXECUTED, corroborationStatus: CorroborationStatus.NOT_EXECUTED, humanValidationStatus: HumanValidationStatus.NOT_EXECUTED } });

## P1 — Determinism & Isolation
_See test file additions below for runtime verification_

## P2 — Deep Legal Pipeline
### P2.1 Fact Provenance (source field)
src/engine/BCCAAEngine.ts:276:  source: SourceSpan;
src/engine/BCCAAEngine.ts:1364:          const source: SourceSpan = {
src/engine/BCCAAEngine.ts:1944:        ctx.factRegistry.set(factId, { factId, propositionId, assertionId, proposition: `[AUTO] ${subject} ${predicate} — not mentioned in input`, subject, predicate, object: null, truth: Tristate.UNKNOWN, polarity: AssertionPolarity.UNKNOWN, source: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" }, assertionType: AssertionType.INFERRED, validationStatus: ValidationStatus.UNVERIFIED, confidence: FactConfidence.CANDIDATE, validation: { extractionStatus: ExtractionStatus.NOT_EXECUTED, sourceStatus: SourceStatus.UNRESOLVED, authenticationStatus: AuthenticationStatus.NOT_EXECUTED, corroborationStatus: CorroborationStatus.NOT_EXECUTED, humanValidationStatus: HumanValidationStatus.NOT_EXECUTED } });
src/engine/BCCAAEngine.ts:2664:      source: f.source,
src/engine/BCCAAEngine.ts:2696:        provenance: atomicFacts.map((f) => ({ factId: f.factId, source: f.source,
src/engine/BCCAAEngine.ts:2908:        atomicFacts: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, propositionId: f.propositionId, assertionId: f.assertionId, proposition: f.proposition, subject: f.subject, predicate: f.predicate, object: f.object, truth: f.truth, polarity: f.polarity, source: f.source, assertionType: f.assertionType, validationStatus: f.validationStatus, confidence: f.confidence, assertedBy: f.assertedBy, eventDate: f.eventDate, normalizedValue: f.normalizedValue, contradicts: f.contradicts, supports: f.supports, disputedProposition: f.disputedProposition, validation: f.validation, provenanceAssertions: f.provenanceAssertions })),
src/engine/BCCAAEngine.ts:2910:        provenance: Array.from(ctx.factRegistry.values()).map((f) => ({ factId: f.factId, source: f.source,

### P2.2 Fact ID Generation
src/engine/BCCAAEngine.ts:267:  factId: string;
src/engine/BCCAAEngine.ts:395:  factIds: string[];
src/engine/BCCAAEngine.ts:398:    factId: string;
src/engine/BCCAAEngine.ts:420:    factId: string;
src/engine/BCCAAEngine.ts:1299:        factId: f.factId, subject: f.subject, predicate: f.predicate, object: f.object,
src/engine/BCCAAEngine.ts:1417:          const factId = shortId("F", ctx.factCounter++);
src/engine/BCCAAEngine.ts:1419:            factId, propositionId, assertionId,
src/engine/BCCAAEngine.ts:1442:          ctx.factRegistry.set(factId, fact);
src/engine/BCCAAEngine.ts:1445:            description: `FACT -> PROPOSITION -> ASSERTION: ${factId}`,
src/engine/BCCAAEngine.ts:1447:            result: `${factId}:${propositionId}:${assertionId}`,
src/engine/BCCAAEngine.ts:1477:      const original = ctx.factRegistry.get(fact.factId);
src/engine/BCCAAEngine.ts:1478:      if (!original) throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: unknown fact ${fact.factId}.`);
src/engine/BCCAAEngine.ts:1487:        throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: fact ${fact.factId} identity mutated by validator.`);
src/engine/BCCAAEngine.ts:1501:        throw new Error(`FACT_VALIDATION_INTEGRITY_ERROR: fact ${fact.factId} truth silently mutated from UNKNOWN to ${fact.truth} by validator.`);
src/engine/BCCAAEngine.ts:1504:      ctx.factRegistry.set(fact.factId, fact);
src/engine/BCCAAEngine.ts:1942:        const factId = shortId("F", ctx.factCounter++);
src/engine/BCCAAEngine.ts:1944:        ctx.factRegistry.set(factId, { factId, propositionId, assertionId, proposition: `[AUTO] ${subject} ${predicate} — not mentioned in input`, subject, predicate, object: null, truth: Tristate.UNKNOWN, polarity: AssertionPolarity.UNKNOWN, source: { documentId: "SYSTEM", segment: `[AUTO] No extraction for ${subject} ${predicate}`, sourceType: "OTHER", extractionMethod: "STRUCTURED_INPUT" }, assertionType: AssertionType.INFERRED, validationStatus: ValidationStatus.UNVERIFIED, confidence: FactConfidence.CANDIDATE, validation: { extractionStatus: ExtractionStatus.NOT_EXECUTED, sourceStatus: SourceStatus.UNRESOLVED, authenticationStatus: AuthenticationStatus.NOT_EXECUTED, corroborationStatus: CorroborationStatus.NOT_EXECUTED, humanValidationStatus: HumanValidationStatus.NOT_EXECUTED } });
src/engine/BCCAAEngine.ts:1987:              leftFactId: left.factId,
src/engine/BCCAAEngine.ts:1988:              rightFactId: right.factId,
src/engine/BCCAAEngine.ts:1995:            left.contradicts.push(right.factId);

### P2.3 Chronology Array
src/engine/BCCAAEngine.ts:497:  eventTimeline: LegalEvent[];
src/engine/BCCAAEngine.ts:556:    eventTimeline: [],
src/engine/BCCAAEngine.ts:636:  eventTimelineHash: string;
src/engine/BCCAAEngine.ts:1274:    const chronology = ctx.eventTimeline.map((e) => ({
src/engine/BCCAAEngine.ts:1295:      chronology,
src/engine/BCCAAEngine.ts:1709:  // P0-4: Temporal / chronology facts
src/engine/BCCAAEngine.ts:2031:      ctx.eventTimeline.push({
src/engine/BCCAAEngine.ts:2039:    if (ctx.eventTimeline.length === 0) {
src/engine/BCCAAEngine.ts:2040:      ctx.eventTimeline.push({
src/engine/BCCAAEngine.ts:2700:        eventTimeline: ctx.eventTimeline,
src/engine/BCCAAEngine.ts:2827:        chronology: [],
src/engine/BCCAAEngine.ts:2829:        eventTimeline: [],
src/engine/BCCAAEngine.ts:2914:        eventTimeline: ctx.eventTimeline,
src/engine/BCCAAEngine.ts:3006:    const timelineHash = canonicalHash(ctx.eventTimeline);
src/engine/BCCAAEngine.ts:3025:      eventTimelineHash: timelineHash,
src/engine/BCCAAEngine.ts:3071:        eventTimeline: (response.stage0?.eventTimeline ?? []).map((e) => ({

### P2.4 Contradictions
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
src/engine/BCCAAEngine.ts:1272:      : ({ status: Tristate.UNKNOWN, supportingFactIds: [], conflictDetected: false, sameFamilyConflictingFacts: [] } as FactEvaluationResult);
src/engine/BCCAAEngine.ts:1279:      conflictInfo: ctx.contradictionGraph.length > 0
src/engine/BCCAAEngine.ts:1281:            total: ctx.contradictionGraph.length,
src/engine/BCCAAEngine.ts:1282:            critical: ctx.contradictionGraph.filter((edge) => edge.status === "CRITICAL").length,
src/engine/BCCAAEngine.ts:1283:            edges: ctx.contradictionGraph.map((edge) => ({
src/engine/BCCAAEngine.ts:1302:      ctx.contradictionGraph.map((e) => ({
src/engine/BCCAAEngine.ts:1309:      description: `FactConsistencyGate executed. ancestorDeceased: ${ancestorResult.status}. Conflict: ${ancestorResult.conflictDetected}.`,
src/engine/BCCAAEngine.ts:1392:            // a genuine conflict on an identical proposition — collapsing it
src/engine/BCCAAEngine.ts:1394:            // from contradiction detection (which only compares differing
src/engine/BCCAAEngine.ts:1401:            const conflictingAssertion = existingIsDenial !== newIsDenial;

### P2.5 Evidence Gaps
src/engine/BCCAAEngine.ts:231:  /** P0-3: Document type provenance for evidence classification. */
src/engine/BCCAAEngine.ts:1329:    const evidence = this.executeEvidenceRules(ctx);
src/engine/BCCAAEngine.ts:1336:    const executionStatus = this.determineExecutionStatus(standi, pleading, issues, evidence, merits, equity, procedure, appeal);
src/engine/BCCAAEngine.ts:1340:      caseId, domain, legislation, limitation, standi, pleading, issues, evidence, elementGate, merits, equity, procedure, appeal, executionStatus,
src/engine/BCCAAEngine.ts:2465:      missing.push("Registration evidence");
src/engine/BCCAAEngine.ts:2468:      missing.push("Payment evidence");
src/engine/BCCAAEngine.ts:2539:    evidence: { missingEvidence: string[] },
src/engine/BCCAAEngine.ts:2547:    if (issues.framedIssues.length === 0 && evidence.missingEvidence.length === 0 && merits.meritScore >= 80 && equity.equityScore >= 1 && procedure.proceduralCompliance && !appeal.appealable) return "COMPLETED";
src/engine/BCCAAEngine.ts:2623:      recommendations: ["Gather additional evidence for missing elements."],
src/engine/BCCAAEngine.ts:2645:      evidence: ReturnType<BCCAAEngine["executeEvidenceRules"]>;
src/engine/BCCAAEngine.ts:2754:        oralAssertions: deps.evidence.oralAssertions,
src/engine/BCCAAEngine.ts:2755:        documentaryEvidence: deps.evidence.documentaryEvidence,
src/engine/BCCAAEngine.ts:2756:        missingEvidence: deps.evidence.missingEvidence,
src/engine/BCCAAEngine.ts:2849:        evidenceList: [],
src/engine/BCCAAEngine.ts:2934:        evidenceList: [],

## Security / Hygiene
### Type Check

### Full Test Suite
]

 [32m✓[39m src/engine/BCCAAEngine.phase1b.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 144[2mms[22m[39m
 [32m✓[39m src/engine/BCCAAEngine.phase1.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 65[2mms[22m[39m

[2m Test Files [22m [1m[32m5 passed[39m[22m[90m (5)[39m
[2m      Tests [22m [1m[32m95 passed[39m[22m[2m | [22m[33m3 skipped[39m[90m (98)[39m
[2m   Start at [22m 04:55:06
[2m   Duration [22m 88.79s[2m (transform 2.43s, setup 0ms, import 2.90s, tests 820ms, environment 77.76s)[22m


### Build

### Git Diff Check

## Audit Complete
