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
  caseId: 'P5-15-8-PROBE',
  input: {
    factPattern: narrative,
    // Intentionally omit limitationReferenceDate first
  },
});

console.log('=== STAGE 3 (Limitation) ===');
console.log(JSON.stringify(result.stage3, null, 2));

console.log('\n=== ALL EXTRACTED ATOMIC FACTS ===');
const facts = result.stage0?.atomicFacts || [];
facts.forEach((f, i) => {
  console.log(`[${i}] ${f.subject} | ${f.predicate} | ${f.object} | truth=${f.truth} | validation=${f.validationStatus} | eventDate=${f.eventDate}`);
});

console.log('\n=== FACTS THAT LOOK LIKE LIMITATION APPLICABILITY CANDIDATES ===');
const candidates = facts.filter(f =>
  /relief|contract|performance|refusal|fixed|registration|deposit|agreement/i.test(
    `${f.subject} ${f.predicate} ${f.object || ''}`
  )
);
candidates.forEach(f => {
  console.log(`- ${f.predicate} = ${f.object} | validated=${f.validationStatus} | eventDate=${f.eventDate}`);
});

console.log('\n=== CLAIM TYPE / DOMAIN ===');
console.log('claimType:', result.claimType);
console.log('domain:', result.domain);
