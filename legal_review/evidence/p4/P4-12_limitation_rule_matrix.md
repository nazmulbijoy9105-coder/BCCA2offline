# P4-12 — Bangladesh Limitation Rule Matrix

Audit date: 2026-09-03
Branch: legal-audit/remediation
Baseline HEAD: 3289108

## Purpose

This matrix defines the minimum legal predicates required before the BCCAA
limitation engine may select a limitation article and compute a limitation
result.

The engine MUST NOT infer a limitation period solely from a broad claim label
such as "specific performance", "declaration", "possession", or "inheritance".

Each rule requires:
1. Relief/cause-of-action identification.
2. Statutory article identification.
3. Temporal applicability/version.
4. Accrual trigger.
5. Institution/reference date.
6. Statutory computation/exclusion analysis.
7. Fail-closed handling of unresolved mandatory predicates.

---

## RULE L-113 — Specific Performance

### Authority

Limitation Act 1908, First Schedule, Article 113.

### Current rule

Period: ONE YEAR.

### Accrual alternatives

A. If a definite date is fixed for performance:
   limitation begins from that date.

B. If no date is fixed:
   limitation begins when the plaintiff has notice that performance
   is refused.

### Additional statutory interaction

Transfer of Property Act 1882, Section 54A may prescribe a deemed six-month
period for execution and registration where an immovable-property sale
contract does not specify the relevant time.

### Required facts

- contract exists;
- relief sought is specific performance;
- contract type identified;
- whether immovable-property sale contract;
- whether date for performance is expressly fixed;
- contractual performance date, if fixed;
- if no date fixed, legally sufficient refusal/notice date;
- where applicable, Section 54A applicability;
- institution date.

### Engine status

CURRENT IMPLEMENTATION: DEFECTIVE.

Known defect:
- hardcoded 3 years;
- refusal-date-centric logic;
- no Article 113 field population;
- no historical versioning;
- no complete statutory trigger selection.

---

## RULE L-142 — Recovery of Khas Possession / Relevant Dispossession Cases

### Authority

Limitation Act 1908, First Schedule, Article 142.

### Current rule

Period: TWELVE YEARS.

### Accrual trigger

Date of dispossession or discontinuance of possession, where the suit
falls within Article 142.

### Required facts

- recovery of possession is actually sought;
- plaintiff's asserted entitlement/right to possession;
- dispossession/discontinuance is pleaded where required;
- exact or legally determinable dispossession date;
- institution date;
- property/relief facts sufficient to distinguish Article 142 from other
  limitation articles.

### Important distinction

Specific Relief Act 1877 Section 8 supplies the substantive recovery remedy.
It does NOT itself establish a universal 12-year limitation period.

### Engine status

CURRENT IMPLEMENTATION: DEFECTIVE.

Known defect:
- generic "DECLARATION_AND_POSSESSION" maps automatically to 12 years;
- possession extraction compresses multiple factual states into
  DISPOSSESSED;
- no article applicability gate.

---

## RULE L-120 — Residual Declaration / Other Suit Where No Specific Period Applies

### Authority

Limitation Act 1908, First Schedule, Article 120.

### Current rule

Period: SIX YEARS.

### Accrual trigger

When the right to sue accrues.

### Required facts

- exact relief;
- cause of action;
- confirmation that no more specific First Schedule article applies;
- accrual event/date;
- institution date.

### Important distinction

Article 120 MUST NOT be selected merely because a claim is labelled
"declaration".

### Engine status

CURRENT IMPLEMENTATION: ABSENT.

---

## RULE L-91 — Cancellation / Set Aside Instrument

### Authority

Limitation Act 1908, First Schedule, Article 91.

### Current rule

Period: THREE YEARS.

### Accrual trigger

When the facts entitling the plaintiff to have the instrument cancelled
or set aside become known to the plaintiff.

### Required facts

- cancellation/set-aside relief;
- instrument identified;
- facts establishing entitlement to cancellation;
- knowledge date;
- institution date.

### Engine status

CURRENT IMPLEMENTATION: ABSENT.

---

## RULE L-92 — Forgery Declaration

### Authority

Limitation Act 1908, First Schedule, Article 92.

### Current rule

Period: THREE YEARS.

### Accrual trigger

Knowledge of the issue/registration of the alleged forged instrument,
subject to the exact statutory wording and applicable facts.

### Required facts

- forgery-related relief;
- instrument;
- relevant issue/registration event;
- plaintiff's knowledge date;
- institution date.

### Engine status

CURRENT IMPLEMENTATION: ABSENT.

---

## RULE L-149 — Government Suit

### Authority

Limitation Act 1908, First Schedule, Article 149.

### Current rule

Period: SIXTY YEARS, subject to the article's statutory qualification.

### Required facts

- Government is plaintiff / suit brought by or on behalf of Government;
- nature of underlying cause of action;
- corresponding private-suit limitation trigger;
- institution date.

### Engine status

CURRENT IMPLEMENTATION: ABSENT.

---

# GENERAL STATUTORY COMPUTATION GATES

## GATE G-3 — Section 3

Limitation is mandatory subject to the statutory provisions of the Act.

The engine must not treat limitation as an advisory score.

If a suit is instituted after the prescribed period, the result must reflect
the statutory consequence, subject to applicable statutory exceptions and
extensions.

---

## GATE G-4 — Section 4

If the prescribed period expires on a day when the prescribed court is closed,
the statutory extension rule must be considered.

---

## GATE G-5 — Section 5

Section 5 concerns appeals and applications in specified circumstances.

The engine MUST NOT automatically apply Section 5 to ordinary civil suits.

---

## GATE G-6 — Sections 6–8

Legal disability must be evaluated where relevant.

The engine must distinguish:
- disability existing when limitation would otherwise begin;
- subsequent disability;
- multiple disabilities;
- statutory limitations on the benefit.

No universal disability extension may be inferred.

---

## GATE G-12 — Section 12

The day from which the limitation period is reckoned is excluded in
computation according to the statutory rule.

The engine MUST NOT implement limitation as:

    years × 365.25 days

---

## GATE G-13 — Section 13

Absence of the defendant from Bangladesh must be evaluated only where the
statutory conditions are satisfied.

---

## GATE G-14 — Section 14

Time spent prosecuting another civil proceeding may be excluded where the
statutory requirements are satisfied.

Required predicates include the legally relevant good-faith/due-diligence
and jurisdiction/other statutory conditions.

---

## GATE G-15+ — Other statutory exclusions/extensions

The engine must maintain explicit rule objects for applicable Limitation Act
provisions rather than embedding exclusions invisibly inside arithmetic.

Potentially applicable provisions must be evaluated from facts before the
final limitation result is marked COMPUTABLE.

---

# REFERENCE DATE RULE

The engine MUST distinguish:

1. date of institution/filing of suit;
2. date of legal analysis/execution;
3. date supplied by the user as a reference date;
4. contractual dates;
5. accrual dates.

`submissionDate` MUST NOT silently serve as the legal institution date unless
the input schema explicitly establishes that semantic.

Missing institution/reference date MUST produce INDETERMINATE rather than
defaulting to timestamp zero.

---

# HISTORICAL VERSION RULE

Limitation rules must be versioned where statutory amendments changed the
operative period.

Article 113 is a confirmed example:

- historical period: THREE YEARS;
- current period: ONE YEAR;
- current one-year period applies after the relevant amendment effective
  01-07-2005.

Therefore the engine MUST NOT use a single timeless Article 113 constant.

---

# SUCCESSION / INHERITANCE RULE

No universal rule may be encoded as:

    death date + 12 years

The limitation article depends on the actual relief/cause of action and
applicable substantive law.

At minimum the engine must determine:

- succession/inheritance issue;
- property classification;
- personal-law applicability where relevant;
- relief actually sought;
- partition/declaration/recovery/cancellation or other cause;
- applicable limitation article;
- accrual trigger;
- institution date.

Article 123/144 MUST NOT be presented as a universal inheritance or partition
rule without an article-specific applicability analysis.

---

# ARTICLE SELECTION PRIORITY

The engine should follow this conceptual sequence:

FACTS
  ↓
RELIEF
  ↓
CAUSE OF ACTION
  ↓
STATUTORY ARTICLE CANDIDATES
  ↓
ARTICLE APPLICABILITY PREDICATES
  ↓
TEMPORAL VERSION
  ↓
ACCRUAL TRIGGER
  ↓
STATUTORY EXCLUSIONS / EXTENSIONS
  ↓
INSTITUTION DATE
  ↓
CALENDAR COMPUTATION
  ↓
TIME-BAR RESULT
  ↓
PROVENANCE / AUTHORITY

The engine MUST NOT follow:

CLAIM LABEL
  ↓
HARDCODED NUMBER OF YEARS
  ↓
365.25-DAY ARITHMETIC
  ↓
TIME-BAR RESULT

---

# FAIL-CLOSED REQUIREMENT

If any mandatory article-selection predicate is UNKNOWN:

    limitationArticle = UNKNOWN
    limitationPeriod = UNKNOWN
    accrualDate = UNKNOWN
    isTimeBarred = UNKNOWN
    timelineValidation.isValid = false
    status = INDETERMINATE / HALT

The exact halt status must follow the existing BCCAA gate semantics.

No unresolved limitation result may be represented as legally verified.

---

# TEST REQUIREMENTS

The remediation test suite must eventually cover at minimum:

1. Current Article 113 = 1 year.
2. Historical Article 113 = 3 years before the amendment effective date.
3. Article 113 with fixed performance date.
4. Article 113 without fixed performance date.
5. Article 113 refusal-notice branch.
6. Section 54A interaction where applicable.
7. Article 142 with proven dispossession date.
8. Article 142 without dispossession date → INDETERMINATE.
9. Article 120 residual declaration case.
10. Article 91 cancellation case.
11. Article 92 forgery case.
12. Article 149 Government case.
13. Section 12 first-day exclusion.
14. Section 4 court-closure scenario.
15. Section 14 exclusion scenario.
16. Missing institution/reference date → INDETERMINATE.
17. Succession without article-specific relief → INDETERMINATE.
18. No universal Article 123/144 inheritance conclusion.
19. Calendar anniversary computation.
20. Stable deterministic output and provenance.

---

# P4-12 DECISION

The present limitation engine is NOT production legally reliable.

Required remediation is architectural, not merely numeric.

The primary remediation target is an article-driven limitation registry and
applicability evaluator with explicit temporal versioning, accrual predicates,
statutory exclusion gates, institution-date semantics, calendar computation,
and fail-closed behavior.
