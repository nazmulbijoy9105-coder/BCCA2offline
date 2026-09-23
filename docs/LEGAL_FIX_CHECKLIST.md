# BCCA2 — LEGAL FIX CHECKLIST (Canonical, Evidence-Based)

> Master legal-defect/gap register. Every status is repository-evidence-backed.
> Sources: structural forensic inventory (HEAD 80cb69a), L1–L20 legal production
> baseline audit (4639d8f), corpus census (feat/p4-04-batch1-foundation).
> Method note: keyword scan = presence-only. 🟡 means "code/test exists", NOT
> "law modeled correctly". 🟡→✅ requires golden-case pass or dedicated legal
> semantics review (P7 / PLCP-07). Fail-closed stubs are architectural, not defects.
Legend: ✅ evidence-backed | 🟡 present, partial/untested | 🔴 absent |
🔒 deliberate fail-closed stub | ⬜ unscanned | 🔄 this cycle

---

## 1. FINDINGS REGISTER

| ID | Finding | Status | Fix path |
|----|---------|--------|----------|
| F1 | Dual provenance chain: CitationValidator (12 precedents, deterministic IDs `AUTH-PRECEDENT-CIT-*`, ratioDecidendi, verificationHash) vs AuthorityRegistry (2 STATUTE records, zero PRECEDENT) | open | P5-01..03 promotion |
| F2 | "Element mismatch 3 vs 8" — RESOLVED: grep undercount. Actual: 5 canonical claims (ClaimMatrixProvenance.test:16 toHaveLength(5)), 5 element rules | closed | p3-09 guards (4639d8f) |
| N1 | Two-tier limitation system: corpus (194/194 reference) vs executable registry (10/192) | open | P4-04b batches 2–6 |
| N2 | F1 refinement: citation layer now has deterministic precedent IDs; registry chain still separate | open | same as F1 |
| N3 | Corpus identity infra present: CorpusHasher/IntegrityVerifier/VersionLock/ObsoleteLawProtector/AmendmentTracker/EffectiveDateResolver/ENGINE_MANIFEST(BD-2026.08) | informational | lifts PLCP-01..05 |
| N4 | ID-namespace collision: engine-internal P3-xx (P3-07=appealability) vs master checklist P3-xx (P3-07=time determinism) | open | commit/doc prefix convention: `P3-09(engine)` |
| N5 | AppellateLimitationCalculator uses local-timezone `new Date()`+`setDate` arithmetic — TZ-sensitive, leap-day unsafe | open | UTC patch (isoDate.addDaysISO) — patch pending, needs current source block |
| N6 | Registry Art 114/115/116 carry possession-rule content while corpus assigns rescission(1y)/insane-conveyance(3y)/registered-contract(6y); Art 149 SUSPENDED | open | PLCP-07 legal review; whitelisted in reconciliation test R5 |
| N7 | **Evidence Act 1872 cited as current law** (CitationValidator ss.35/114/101–103, ratioDecidendi, PDF headers). Bangladesh replaced it with Qanun-e-Shahadat Order 1980 (P.O. No. 10 of 1980) — citing a repealed act contradicts ObsoleteLawProtector's own mandate | open | **HIGH-priority PLCP-07 verification**: confirm repeal status from primary source; map sections (candidates: s.101→QSO Art 117, s.102→118, s.103→119, s.114→129); update corpus + CitationValidator + tests |
| G1 | Schedule commencement 1908-01-01 across 4 layers; correct = 1909-01-01 (s.1(2): ss.1&31 at once, remainder 1 Jan 1909); resolver used circular justification "as established in registry" | **fixed Batch 1** | registry ×10, BCCAAEngine element rule ×1, DevelopmentStatuteRegistry ×1, EffectiveDateResolver (circularity broken, R6 pin) |
| G2 | Period-unit schema gap: division_2 appeals (7d–90d, 6mo) + division_3 unrepresentable in `limitationPeriodYears` | partial Batch 1 | contracts v2 additive (periodValue/periodUnit) done; evaluator wiring = Batch 2/4 |
| G3 | Tombstones: 3 schedule omitted entries (Art 133@1923, 150A@1949/II-1950, 162A@1965) + 3 metadata text mentions = grep -c 6 | open | OMITTED-status promotion, Batch 6; enables future ART_133 reference hard-fail |
| — | Stale `>>> INSERT NEW ARTICLE` markers (targets already defined below them) | **fixed Batch 1** | sed cleanup |
| — | `getActEffectiveDate` was dead export | **fixed Batch 1** | pinned by reconciliation R6; becomes codegen seed source |

---
## 2. IN-FLIGHT — P4-04 BATCH 1 (unblock first)

| Item | State |
|------|-------|
| src/utils/isoDate.ts + tests (UTC-safe arithmetic, leap/month-end) | created, commit blocked by hook |
| 1909-01-01 fix across 4 files | applied (sed verified), commit blocked |
| Reconciliation test R1–R6 | created, commit blocked |
| Contracts v2 (LimitationPeriodUnit, periodValue/periodUnit) | applied, **union already has 8 triggers** — hand-added CONTRACT_BREACH_DATE/ADVERSE_POSSESSION_DATE |
| Codegen scaffold scripts/generate-limitation-registry.ts (unwired) | created, commit blocked |
| **BLOCKER** | `LimitationEvaluator.ts:236` Record<LimitationAccrualTrigger,string> missing 2 keys (TS2739) |
| **Unblock** | D1 diagnostics (union grep + contracts grep + diff) → perl add 2 fail-closed map entries (`Contract Breach Date`, `Adverse Possession Date` → INDETERMINATE until extraction exists) → tsc clean → 5 commits |

Pre-commit hook enforcement verified (blocked incomplete edit from entering repo) — governance evidence.

---

## 3. P3 LEGAL RESIDUALS

| ID | Item | Status | Action |
|----|------|--------|--------|
| P3-07 checklist | Time determinism | 🟡→near ✅ | reasoning Date.now()-free (verified), submissionDate-anchored; **sole residual = N5 appellate patch** |
| P3-07(engine) | Appealability fail-closed | ✅ | NOT_DETERMINED semantics + tests |
| P3-08 | Randomness/UUID | ✅ | 80cb69a |
| P3-09(engine) | Claim-rule binding boundary | ✅ | 4639d8f |
| P3-10(engine) | Production readiness (current branch) | 🔄 | Batch 1 + this checklist |

---

## 4. P4 — BANGLADESH LEGAL CORPUS

| ID | Area | Status | Evidence | Next action | Gate to ✅ |
|----|------|--------|----------|-------------|-----------|
| P4-04a | Corpus completeness | ✅* | 194/194 First Schedule (158 suits + 9 appeals incl 150A-omitted + 27 applications); Art 86 via 86(a)/(b); 3 tombstones | enumerate omitted via `grep -n '"omitted"'` (expect 133/150A/162A) | — |
| P4-04b | Executable registry | 🔄 | 10/192; Batch 1 in-flight; G1 fix; trigger seeds | Batches 2–6 (below); Phase B trigger-class ontology (~171 raw strings → ~25–35 classes) | per-batch reconciliation + evaluator wiring |
| P4-01 | SRA 1877 | 🟡+ | s.8/9/12/21A/42+proviso/52–57 modeled + precedents | golden cases | P7-01 pass |
| P4-02 | TPA 1882 | 🟡- | s.54 doctrine only | add s.53A, s.53 TP, lease ss.105–117, mortgage ss.58–76 (with P4-09) | semantics review |
| P4-03 | CPC 1908 | 🟡+ | Orders I/VII/XIV/XX/XXI/XXXVII, ss.9/35/48/100/128 | add Order IX, XLI, XLVII, s.151 | semantics review |
| P4-05 | Partition | 🟡+ | canonical claim + Order XX R.18 joinder + extraction tests | run getUnboundCanonicalElements — resolve PARTITION binding intent | binding decision logged |
| P4-06 | Possession | 🟡+ | DP-POSSESSION + Arts 135–144 corpus | Batch 2 promotion | golden pass |
| P4-07 | SRA §42 | 🟡+ | canonical claim + proviso enforcement + precedent | golden cases | P7-01 pass |
| P4-08 | Specific performance | 🟡+ | flagship: SP-REG/SP-DEPOSIT, s.12/24(b), s.21A+challan doctrine, readiness precedents | golden cases | P7-01 pass |
| P4-09 | Mortgage | 🟡- | corpus Arts 135/146/147/148 only; TPA s.58–76 substantive absent | Batch 2 promotion + TPA mortgage rules | — |
| P4-10 | Money/debt | 🟡- | corpus Arts 61–63/73/85, ss.19/20; no canonical claim | future claim MONEY_RECOVERY + Batch 3 | — |
| P4-11 | Pre-emption | 🟡- | corpus Art 10 + s.8 exclusion only | **scoping: identify operative statute** (Pre-emption Act 1877 vs EBST Act 1950 s.90) — PLCP-07 | — |
| P4-12 | Mutation | 🟡 | namjari doctrine + extraction tests + Warisan Sanad gate | — | — |
| P4-13 | Tort/damages | 🟡- | corpus Arts 23/26/27/42; damages extraction | scoping: operative tort framework | — |
| P4-14 | Lease/tenancy | 🟡- | corpus Arts 110/139/152 | with P4-15 dependency | — |
| P4-15 | Premises Rent Control 1991 | 🔴 | zero hits ("current" false-positives) | **new corpus**: s.10(1) eviction grounds, s.18 deposit, s.19 rent increase (verify numbering) | corpus→registry |
| P4-16 | Family Courts Ord 1985 | 🔴 | zero hits | new corpus: s.5 jurisdiction, s.10/10A, s.17 | corpus→registry |
| P4-17 | MFLO 1961 | 🔴 | zero hits | new corpus: s.5 registration, s.6 polygamy, s.7 talaq notice | corpus→registry |
| P4-18 | Admin-order challenge | 🔴 | zero hits | scoping: civil vs writ (Constitution Arts 102/199) boundary | — |
| P4-19 | Jurisdiction | 🟡- | extraction + Civil Courts Act 1887 refs; JurisdictionEvaluator NOT_DETERMINED stub | validated pecuniary schedule + governing sections | NOT_DETERMINED→deterministic |
| P4-20 | Court fee | 🔒 | fail-closed gate + tests; actRef Court Fees Act 1870 | validated Schedule II data required before implementation | production data + PLCP-08 |
| P4-21 | Procedure | 🟡+ | ProceduralEnforcementGate, Order VII R.11 audit | — | — |
| P4-22 | Evidence | 🟡⚠ | ss.101–103/35/114 + Registration 17/49 + custody subsystem + redactor | **N7**: Evidence Act→QSO 1980 verification+mapping FIRST | PLCP-07 |

### P4-04b batch plan
| Batch | Scope | Count | Prereq |
|-------|-------|-------|--------|
| 1 ✅(in-flight) | reconcile 10 + G1 + type widening + unit contract + scaffold | 10 | evaluator map unblock |
| 2 | possession family 135–141,143,146–148 | ~14 | trigger Class 1 (DISPOSSESSION family) reviewed |
| 3 | contract/money 57–116 zone | ~30 | Classes 5–7 |
| 4 | division_2 appeals | 9 | G2 evaluator wiring (DAY/MONTH) |
| 5 | division_3 applications | 27 | G2 + Classes 2/10 |
| 6 | remainder + 3 tombstones (OMITTED status) | ~101+3 | Phase B completion |

---

## 5. P5 — AUTHORITY / CASE-LAW GOVERNANCE

| ID | Item | Status | Action |
|----|------|--------|--------|
| P5-01/02/03 | SC/HCD/AD authority registry | 🔴 | promote 12 CitationValidator precedents → AuthorityRecord[PRECEDENT]; reconcile AUTH-PRECEDENT-CIT-* IDs; digest bump + N4AuthorityRegistryIntegrity update (F1/N2) |
| P5-04 | Citation normalization | 🟡+ | normalizeCitationString + 12 canonical; **dedicated test file absent** → create CitationValidator.test.ts (normalize, unknown-citation fail-closed, hash determinism) |
| P5-05 | Ratio/proposition | 🟡+ | ratioDecidendi/summaryOfHolding/factualContextTag per precedent | 
| P5-06 | Statute→authority binding | 🟡 | BD-SRA-1877-SEC* + SOURCE_VERIFIED + provenance violation checks; corpus-wide binding pending |
| P5-07 | Overruled/distinguished handling | 🔴 | schema (status: OVERRULED/DISTINGUISHED + overrulingAuthorityId) + data + CitationEnforcementGate rule |
| P5-08 | Hierarchy | 🟡- | AD>HCD declared (UI/courtForum) only; enforce binding-weight in CitationEnforcementGate |
| P5-09 | Source verification | 🟡+ | BANGLADESH_MINISTRY_OF_LAW hash payload + SourceProvenanceResolver |
| P5-10 | Independent validation | 🔴 | PLCP-08 process |

---

## 6. P6 — REASONING QUALITY (legal)

| ID | Item | Status | Action |
|----|------|--------|--------|
| P6-01 | Claim extraction | ✅ | substantially done (5 canonical claims, anti-misclassification suite) |
| P6-02 | Claim→element | 🟡+ | p3-09 fatal mismatch guards; PARTITION binding intent TBD |
| P6-03 | Element→fact | 🟡- | element gate + predicate map; extension per Batch 2+ triggers |
| P6-04 | Missing evidence | 🟡+ | MissingEvidenceGate + EvidenceIntegrityGate; strengthened by trigger promotion (no_candidate_rule→missing fact) |
| P6-05 | Contradictory facts | 🟡+ | FactConsistencyGate (temporal, doctrine-clash, death-date conflict) |
| P6-06 | Alternative theories | 🔴 | explicit generation absent (clash *detection* only) — design item |
| P6-07 | Adverse facts | 🟡 | two-sided contest (G9) |
| P6-08 | Uncertainty propagation | 🟡+ | Tristate/CANDIDATE/HV statuses; INDETERMINATE chain |
| P6-09 | No unsupported conclusion | 🟡+ | FactConclusionTraceabilityChecker hard-fail |
| P6-10 | Human-review escalation | 🟡+ | recommendations + STRUCTURAL_ONLY gate |

---

## 7. P7 — GOLDEN / ADVERSARIAL TESTS

| ID | Item | Status | Action |
|----|------|--------|--------|
| P7-01 | Golden cases | 🔴 | biggest testing gap; depends: F1 + P4-04b batch 2. Start: 5 canonical claims × (full-pass, partial, INDETERMINATE, HALT) |
| P7-02 | Adversarial | 🟡🔄 | tamper suite: MUTATED-RULE, TAMPERED-AUTHORITY-*, FACT_VALIDATION_INTEGRITY_ERROR, P1-STRESS |
| P7-03/04/05 | Dates | 🟡🔄 | Art 113 amendment boundary (2005-07-01), missing/malformed/future fail-closed; add leap-day/month-end via isoDate cases in appellate patch |
| P7-06/07/08 | Wrong statute/forum/authority | 🟡- | fail-closed negatives exist (999 DLR, forum prerequisite, unknown rule, anti-fallback); full authoring after F1 |
| P7-09 | Duplicate facts | 🟡 | FactConflictResolver + duplicate-death-date detection |
| P7-10 | Malformed input | 🟡 | malformed date, empty pattern fail-closed |
| P7-11 | Regression corpus | 🟡 | FIX #6/8/9/16/24 guards |
| P7-12 | Integration | 🟡 | phase1–3 + FailClosedEngineIntegration + 3-run determinism |

---

## 8. PLCP — GOVERNANCE

| ID | Item | Status | Action |
|----|------|--------|--------|
| PLCP-01 | Corpus source registration | 🟡 | kb_name/source/version + ENGINE_MANIFEST frozen |
| PLCP-02 | Rule provenance | 🟡 | ClaimMatrixProvenance hash + completeness + production-approval chain |
| PLCP-03 | Rule versioning | 🟡 | ruleGraphVersion/digest; bump discipline per batch |
| PLCP-04 | Authority provenance | 🟡 | AuthorityRegistryHasher identity verify chain |
| PLCP-05 | Change audit | 🟡 | hash-chain audit + git trail + pre-commit hook (verified) |
| PLCP-06 | Reviewer assignment | 🔴 | process doc |
| PLCP-07 | **Human legal validation** | 🔴 | **ACTIVE QUEUE (below)** |
| PLCP-08 | Independent validation | 🔴 | process |
| PLCP-09 | Production approval | 🟡 | machine-side gate complete; human sign-off pending |
| PLCP-10 | Release certificate | 🔴 | digest exists; certificate format/process absent |
| PLCP-11 | Rollback governance | 🔴 | absent |
| PLCP-12/13 | Human gates | 🔴 | process |

### PLCP-07 ACTIVE REVIEW QUEUE (legal decisions blocking code)
| # | Decision | Blocks |
|---|----------|--------|
| Q1 | N6: registry Art 114/115/116 content vs corpus numbering — which is correct data? | Batch 1 whitelist removal, Batch 2 |
| Q2 | N7: Evidence Act 1872 → Qanun-e-Shahadat Order 1980 repeal verification + section mapping | P4-22, all evidence citations |
| Q3 | Trigger-class ontology (≈25–35 classes from 171 strings) — Phase B mapping table | Batches 2–6 |
| Q4 | Amendment commencement dates for 1929/1961/1965-inserted articles (corpus lacks them) | codegen effectiveFrom seeds |
| Q5 | P4-11 operative pre-emption statute | P4-11 corpus |
| Q6 | PARTITION unbound-element intent (deliberate vs gap) | P6-02 |

---

## 9. EXECUTION ORDER

1. **Unblock Batch 1** (D1 → evaluator map fix → tsc → 5 commits)
2. Commit this checklist
3. N5 appellate UTC patch (closes P3-07) — needs current `AppellateLimitationCalculator.ts` block
4. Tombstone enumeration verify (G3)
5. PLCP-07 queue Q1/Q2 (highest legal risk first)
6. P5-04 dedicated citation test file
7. F1 precedent promotion → P5-01..03
8. Batch 2 → 3 → 4 → 5 → 6 (P4-04b)
9. P7-01 golden corpus (after 7+8)
10. P7-06/07/08 full adversarial authoring (after 7)
11. P5-07 hierarchy/overruled schema
12. P4-15/16/17 new corpus tracks

## 10. VERIFICATION GATES
- Every commit: pre-commit `tsc --noEmit` (enforcement verified)
- Every batch: `npx vitest run` full suite + reconciliation R1–R6 + registry digest bump
- Status upgrades: 🟡→✅ only via golden-case pass (P7-01) or documented legal semantics review (PLCP-07/08)
