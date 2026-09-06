import { BCCAAEngine } from './src/engine/BCCAAEngine.ts';

const engine = new BCCAAEngine({});

const narrative = `
The plaintiff and defendant executed an unregistered bainapatra on 10 January 2019
for the sale of the suit land. The plaintiff paid earnest money of Tk. 5,00,000.
The balance was to be paid at the time of execution of the sale deed.
The defendant refused to execute the sale deed on 20 August 2020 despite repeated demands.
The plaintiff now seeks specific performance of the contract.
`;

const result = await engine.analyze({
  caseId: 'P5-15-8-PROBE-REF',
  input: {
    factPattern: narrative,
    limitationReferenceDate: '2024-01-15',
  },
});

console.log('=== STAGE 3 (Limitation) WITH REFERENCE DATE ===');
console.log(JSON.stringify(result.stage3, null, 2));

console.log('\n=== KEY APPLICABILITY FACTS ===');
const facts = result.stage0?.atomicFacts || [];
['Relief', 'Contract', 'Fixed Performance Date', 'Performance Date', 'Refusal Date', 'Registration Status'].forEach(pred => {
  const matches = facts.filter(f => f.predicate === pred || (f.predicate && f.predicate.includes(pred)));
  if (matches.length === 0) {
    console.log(`[MISSING] ${pred}`);
  } else {
    matches.forEach(f => {
      console.log(`[FOUND] ${f.predicate} = ${f.object} | validation=${f.validationStatus} | eventDate=${f.eventDate}`);
    });
  }
});
