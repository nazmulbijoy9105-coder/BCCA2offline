# P4-13 — Bangladesh Limitation Act Sections 3–25
# Authoritative Statutory Evidence

Audit date: 2026-09-03
Branch: legal-audit/remediation
Baseline HEAD: 0463680

## Source

Primary source:
Bangladesh Laws / Ministry of Law, Justice and Parliamentary Affairs
The Limitation Act, 1908 (Act IX of 1908)

Official statute:
https://bdlaws.minlaw.gov.bd/act-print-88.html

---

## Section 3 — Mandatory dismissal

Rule:
Subject to Sections 4–25, a suit, appeal or application instituted/made after
the prescribed period is subject to dismissal even where limitation has not
been pleaded.

Institution semantics:
A suit is ordinarily instituted when the plaint is presented to the proper
officer.

ENGINE REQUIREMENT:
- limitation is mandatory;
- institution date must have explicit semantics;
- Sections 4–25 must be evaluated before final computation.

---

## Section 4 — Court closed

Where the limitation period expires on a day when the court is closed, the
matter may be instituted/preferred/made on the day the court reopens.

ENGINE REQUIREMENT:
- final expiry date must be calculated;
- court-closure status must be available where relevant;
- cannot simply declare time-barred from calendar expiry without this gate.

---

## Section 5 — Extension in specified appeals/applications

Section 5 permits extension for specified appeals/applications where sufficient
cause is established.

ENGINE REQUIREMENT:
- MUST NOT be automatically applied to ordinary civil suits;
- proceeding type must be identified;
- sufficient-cause predicate must be separately evaluated.

---

## Sections 6–8 — Legal disability

Sections 6–8 provide statutory rules concerning legal disability and
computation in specified circumstances.

ENGINE REQUIREMENT:
- disability status must be fact-specific;
- date and nature of disability must be established;
- statutory conditions must be checked;
- no universal disability extension.

---

## Section 12 — Exclusion of first day

The day from which the limitation period is reckoned is excluded.

ENGINE REQUIREMENT:
- use statutory calendar computation;
- do not use floating-year arithmetic.

---

## Section 13 — Defendant's absence

Time during which the defendant is absent from Bangladesh and the statutory
territories specified by the Act is excluded in computing limitation.

ENGINE REQUIREMENT:
- defendant identity must be known;
- absence period must be proven;
- statutory applicability must be established;
- no automatic exclusion merely because residence is unknown.

---

## Section 14 — Bona fide proceeding without jurisdiction

Time spent prosecuting another civil proceeding may be excluded where the
statutory requirements are satisfied, including due diligence, good faith,
same cause of action / same relief as applicable, and inability of the prior
court to entertain the matter because of defect of jurisdiction or like cause.

ENGINE REQUIREMENT:
- prior proceeding must be identified;
- commencement and termination dates required;
- relevant cause/relief relationship required;
- due diligence and good faith required;
- jurisdictional failure required.

---

## Section 15 — Suspension / statutory notice

Section 15 contains exclusion rules concerning:
- injunction/order staying institution or execution;
- statutory notice periods.

ENGINE REQUIREMENT:
- identify the exact Section 15 subsection;
- identify the stay/order or statutory notice;
- calculate excluded interval precisely.

---

## Section 16 — Execution-sale proceedings

For the specified suit for possession by a purchaser at a sale in execution
of a decree, time during which proceedings to set aside the sale have been
prosecuted is excluded.

ENGINE REQUIREMENT:
- only apply to the statutory fact pattern;
- do not generalize to all possession claims.

---

## Section 17 — Death before right accrues

Where the relevant person dies before the right to sue/application accrues,
the statutory computation may begin from the time a capable legal
representative exists.

CRITICAL EXCEPTION:
Section 17(3) expressly excludes the operation of subsections (1) and (2)
for suits to enforce rights of pre-emption and suits for possession of
immovable property or hereditary office.

ENGINE REQUIREMENT:
- distinguish death-before-accrual from ordinary death;
- identify legal representative status;
- explicitly evaluate the Section 17(3) exception;
- MUST NOT implement generic "death resets limitation."

---

## Section 18 — Fraud

Where fraud prevents a person from knowing the relevant right or title,
the statutory discovery rule must be evaluated according to the section.

ENGINE REQUIREMENT:
- fraud allegation;
- concealed right/title;
- discovery/knowledge date;
- statutory conditions;
- no automatic extension from merely pleading fraud.

---

## Section 19 — Part payment

Part payment of debt or interest, subject to statutory requirements, can affect
limitation where the section applies.

ENGINE REQUIREMENT:
- liability/debt identity;
- payment date;
- qualifying payment;
- written acknowledgment/signature requirements where applicable;
- effect on limitation must be article-specific.

---

## Section 20 — Acknowledgment/payment by agents

Section 20 addresses acknowledgment/payment by specified persons and agents.

ENGINE REQUIREMENT:
- identify person making acknowledgment/payment;
- establish authority;
- evaluate statutory relationship;
- do not treat every communication as an acknowledgment.

---

## Section 21 — Agent of person under disability

Section 21 defines/qualifies authorized agents for purposes of Sections 19 and
20 and contains additional rules concerning joint contractors, partners,
executors, mortgagees and specified Hindu-law circumstances.

ENGINE REQUIREMENT:
- only invoke where Sections 19/20 are otherwise applicable;
- preserve statutory party/agent relationships.

---

## Section 22 — Substitution/addition of plaintiff or defendant

Where a new plaintiff or defendant is substituted or added after institution,
the statutory institution-date rule applies to that party, subject to the
section's exceptions.

ENGINE REQUIREMENT:
- party addition/substitution date;
- reason for substitution/devolution;
- Section 22 exception analysis;
- limitation cannot be assumed to run from original filing for every added
  party.

---

## Section 23 — Continuing breaches and wrongs

For a continuing breach of contract or continuing wrong independent of
contract, a fresh period begins at every moment during which the breach/wrong
continues.

ENGINE REQUIREMENT:
- determine whether wrong is legally continuing;
- distinguish continuing wrong from completed wrong with continuing effects;
- accrual must not be frozen to first event without analysis.

---

## Section 24 — Special injury compensation

Where an act does not give rise to a cause of action unless specific injury
actually results, limitation is computed from when the injury results.

ENGINE REQUIREMENT:
- injury event required;
- cannot infer accrual from act alone.

---

## Section 25 — Gregorian calendar

Instruments are deemed, for purposes of the Limitation Act, to be made with
reference to the Gregorian calendar.

ENGINE REQUIREMENT:
- calendar arithmetic must be deterministic;
- no 365.25-day approximation;
- date addition should operate using statutory calendar/anniversary logic.

---

# CRITICAL ENGINE CONSEQUENCES

The current implementation must NOT:

1. use `365.25` days per year;
2. default missing `referenceDate` to timestamp zero;
3. treat `submissionDate` as institution date without explicit schema semantics;
4. universally apply Section 5 to suits;
5. universally extend limitation for disability;
6. universally reset limitation because of death;
7. ignore Section 17(3);
8. automatically exclude time under Section 14 without its predicates;
9. treat every continuing consequence as a continuing wrong;
10. compute limitation without Section 12;
11. mark unresolved limitation as `timelineValidation.isValid = true`.

# P4-13 STATUS

Authority extraction establishes that limitation computation is a statutory
decision tree, not merely arithmetic.

The next implementation phase MUST model:
ARTICLE
→ APPLICABILITY
→ ACCRUAL
→ EXCLUSIONS / EXTENSIONS
→ INSTITUTION DATE
→ CALENDAR EXPIRY
→ SECTION 3 CONSEQUENCE
→ PROVENANCE

