# P4-11 — Bangladesh Limitation Law Authoritative Verification

Audit date: 2026-09-03
Branch: legal-audit/remediation
Pre-remediation HEAD: 535ab47

## Verified authorities

### Limitation Act 1908 — Article 113
Specific performance of contract:
- Current period: ONE YEAR.
- Trigger: date fixed for performance.
- If no date is fixed: when plaintiff has notice that performance is refused.
- Bangladesh Supreme Court confirms the previous three-year period was substituted by one year by the Limitation (Amendment) Act, 2004, effective 01-07-2005.

Primary authority:
Supreme Court of Bangladesh, F.A. No. 292 of 2009.
Supreme Court of Bangladesh, A.S. No. 22 of 2021.

### Limitation Act 1908 — Article 142
Relevant declaration/title + recovery of khas possession where plaintiff alleges dispossession or discontinuance:
- Period: TWELVE YEARS.
- Bangladesh Supreme Court requires determination/pleading of the date of dispossession or discontinuance and whether suit was instituted within twelve years.

Primary authority:
Supreme Court of Bangladesh, C.R. No. 2670 of 2019.

### Limitation Act 1908 — Article 120
Where no limitation period is provided elsewhere in the First Schedule:
- Period: SIX YEARS.
- Trigger: accrual of the right to sue.

Primary authority:
Supreme Court of Bangladesh, F.A. No. 245 of 2013.
Supreme Court of Bangladesh, C.R. No. 376 of 2023.

### Limitation Act 1908 — Article 91
Relevant cancellation/set-aside instrument claim:
- Period: THREE YEARS.
- Trigger: facts entitling cancellation/set-aside become known to plaintiff.

### Limitation Act 1908 — Article 92
Relevant forgery declaration claim:
- Period: THREE YEARS.
- Trigger: issue/registration becomes known to plaintiff.

### Limitation Act 1908 — Article 149
Suit by/on behalf of Government:
- Period: SIXTY YEARS, subject to the article's statutory qualification concerning when limitation would begin against a like private suit.

Primary authority for Articles 91, 92, 120 and 149:
Supreme Court of Bangladesh, C.R. No. 376 of 2023.

## Supporting statutory provisions

### Limitation Act 1908 — Section 3
Suit instituted after the prescribed period is subject to dismissal subject to the Act's statutory exceptions/provisions.

### Limitation Act 1908 — Section 12
The statutory computation rules apply when computing limitation, including exclusion of the first day from which the period is reckoned.

### Specific Relief Act 1877 — Section 21A
For specific enforcement of an immovable-property sale contract:
- contract must be in writing;
- contract must be registered under Registration Act 1908;
- balance consideration must be deposited in court at filing.

### Registration Act 1908 — Section 17B
Transitional provisions exist for contracts for sale executed but not registered before Section 17A became effective.

## Engine defects established by P4-07/P4-10

1. Specific performance is hardcoded as 3 years.
2. Specific performance uses refusal date without first determining whether a date was fixed for performance.
3. UI incorrectly labels the specific-performance analysis as Article 54.
4. Article 113 is not actually selected/populated by the limitation engine.
5. Declaration/possession is collapsed into a generic 12-year rule.
6. Article 120 is absent from the actual limitation engine.
7. Succession is incorrectly mapped generically to death + 12 years.
8. Article 123/144 is presented by UI as a universal succession/partition rule without applicability analysis.
9. Limitation calculation uses 365.25-day approximation instead of statutory calendar computation.
10. limitationArticle exists in the output type/UI but is not deterministically produced by executeLimitationEngine.
11. timelineValidation.isValid is hardcoded true even when limitation is unresolved.
12. Existing tests encode the obsolete three-year specific-performance rule.

## Production rule

No limitation result shall be classified VERIFIED/LEGALLY COMPUTABLE unless:
- applicable article is identified;
- relief/cause-of-action predicates support that article;
- statutory temporal version is established;
- operative accrual trigger is established;
- institution/reference date is established;
- applicable statutory computation/exclusion rules are evaluated;
- all unresolved mandatory predicates cause INDETERMINATE/FAIL-CLOSED behavior.

