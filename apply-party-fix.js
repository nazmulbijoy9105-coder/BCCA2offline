const fs = require('fs');
const path = './src/engine/BCCAAEngine.ts';
let src = fs.readFileSync(path, 'utf8');

const oldExtract = `  private extractParties(clause: string, candidates: FactCandidate[]): void {
    // Plaintiff: Name (with honorifics)
    const plaintiffMatch = clause.match(
      /(?:plaintiff|petitioner|complainant)\\s*[:\\-]?\\s+((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?|M\\/s\\.?)?\\s*[A-Za-z][A-Za-z\\s\\.]+?)(?=\\s*(?:,|;|\\.|and|or|vs|versus|is|was|filed|through|aged|son|daughter|of|resident|$))/i
    );
    if (plaintiffMatch) {
      const name = plaintiffMatch[1].trim();
      if (name.length > 2) {
        candidates.push({ subject: "Plaintiff", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "PLAINTIFF" });
      }
    }
    // Defendant: Name (with honorifics)
    const defendantMatch = clause.match(
      /(?:defendant|respondent|opposite\\s+party)\\s*[:\\-]?\\s+((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?|M\\/s\\.?)?\\s*[A-Za-z][A-Za-z\\s\\.]+?)(?=\\s*(?:,|;|\\.|and|or|vs|versus|is|was|filed|through|aged|son|daughter|of|resident|$))/i
    );
    if (defendantMatch) {
      const name = defendantMatch[1].trim();
      if (name.length > 2) {
        candidates.push({ subject: "Defendant", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "DEFENDANT" });
      }
    }
    // Role assignment: "X is purchaser", "Y is vendor"
    const roleMatch = clause.match(/([A-Z][a-zA-Z\\s\\.]+?)\\s+is\\s+(?:the\\s+)?(purchaser|vendor|seller|buyer|owner|heir|co-sharer)/i);
    if (roleMatch) {
      const name = roleMatch[1].trim();
      const role = roleMatch[2].toUpperCase();
      candidates.push({ subject: name, predicate: "Capacity", object: role });
    }
  }`;

const newExtract = `  private extractParties(clause: string, candidates: FactCandidate[]): void {
    const alreadyHas = (n: string) => candidates.some(c => c.predicate === "Party Identity" && c.object === n);

    // --- 1. FORMAL PLEADING LABELS (existing) ---
    const plaintiffMatch = clause.match(
      /(?:plaintiff|petitioner|complainant)\\s*[:\\-]?\\s+((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?|M\\/s\\.?)?\\s*[A-Za-z][A-Za-z\\s\\.]+?)(?=\\s*(?:,|;|\\.|and|or|vs|versus|is|was|filed|through|aged|son|daughter|of|resident|$))/i
    );
    if (plaintiffMatch) {
      const name = plaintiffMatch[1].trim();
      if (name.length > 2 && !alreadyHas(name)) {
        candidates.push({ subject: "Plaintiff", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "PLAINTIFF" });
      }
    }
    const defendantMatch = clause.match(
      /(?:defendant|respondent|opposite\\s+party)\\s*[:\\-]?\\s+((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?|M\\/s\\.?)?\\s*[A-Za-z][A-Za-z\\s\\.]+?)(?=\\s*(?:,|;|\\.|and|or|vs|versus|is|was|filed|through|aged|son|daughter|of|resident|$))/i
    );
    if (defendantMatch) {
      const name = defendantMatch[1].trim();
      if (name.length > 2 && !alreadyHas(name)) {
        candidates.push({ subject: "Defendant", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "DEFENDANT" });
      }
    }

    // --- 2. NARRATIVE: FIRST-PERSON PLAINTIFF ---
    const selfMatch = clause.match(
      /\\b(?:myself|I)\\s*(?:,|\\(|am|:)?\\s*((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?)?\\s*[A-Z][a-zA-Z\\s\\.]+?)(?=\\s*(?:,|;|\\.|and|or|aged|son|daughter|of|resident|filed|through|demand|seek|pray|along\\s+with|together\\s+with|brother|sister|father|mother|\\)|\\())/i
    );
    if (selfMatch) {
      const name = selfMatch[1].trim();
      if (name.length > 2 && !alreadyHas(name)) {
        candidates.push({ subject: "Plaintiff", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "PLAINTIFF" });
      }
    }
    const weMatch = clause.match(
      /\\b(?:we|ourselves)\\s*(?:,|\\()?((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?)?\\s*[A-Z][a-zA-Z\\s\\.]+?)(?:\\s+and\\s+((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?)?\\s*[A-Z][a-zA-Z\\s\\.]+?))?(?=\\s*(?:,|;|\\.|and|or|demand|seek|pray|filed|instituted|brought|claim|petition|along\\s+with|together\\s+with|\\)))/i
    );
    if (weMatch) {
      const names = [weMatch[1], weMatch[2]].filter(Boolean).map(n => n.trim());
      for (const name of names) {
        if (name.length > 2 && !alreadyHas(name)) {
          candidates.push({ subject: "Plaintiff", predicate: "Party Identity", object: name });
          candidates.push({ subject: name, predicate: "Party Role", object: "PLAINTIFF" });
        }
      }
    }

    // --- 3. NARRATIVE: ADVERSARIAL DEFENDANT ---
    const advRegex = /\\b(?:my|our)\\s+(?:brother|sister|son|daughter|father|mother|uncle|aunt|cousin)\\s+((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?)?\\s*[A-Z][a-zA-Z\\s\\.]+?)(?=\\s+(?:obtained|executed|threatened|refused|denied|sold|alienated|transferred|dispossessed|forcibly|fraudulently|unilaterally|against|cheated|defrauded))/i;
    const advMatch = clause.match(advRegex);
    if (advMatch) {
      const name = advMatch[1].trim();
      if (name.length > 2 && !alreadyHas(name)) {
        candidates.push({ subject: "Defendant", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "DEFENDANT" });
      }
    }
    const genericAdv = clause.match(
      /\\b((?:Mr\\.?|Mrs\\.?|Ms\\.?|Md\\.?)?\\s*[A-Z][a-zA-Z\\s\\.]+?)\\s+(?:refused|threatened|denied|sold|alienated|transferred|dispossessed|forcibly|obtained|executed)\\b/i
    );
    if (genericAdv) {
      const name = genericAdv[1].trim();
      if (name.length > 2 && !alreadyHas(name)) {
        candidates.push({ subject: "Defendant", predicate: "Party Identity", object: name });
        candidates.push({ subject: name, predicate: "Party Role", object: "DEFENDANT" });
      }
    }

    // --- 4. ROLE ASSIGNMENT (existing) ---
    const roleMatch = clause.match(/([A-Z][a-zA-Z\\s\\.]+?)\\s+is\\s+(?:the\\s+)?(purchaser|vendor|seller|buyer|owner|heir|co-sharer)/i);
    if (roleMatch) {
      const name = roleMatch[1].trim();
      const role = roleMatch[2].toUpperCase();
      candidates.push({ subject: name, predicate: "Capacity", object: role });
    }
  }`;

if (!src.includes(oldExtract)) {
  console.error('ERROR: old extractParties not found');
  process.exit(1);
}
src = src.replace(oldExtract, newExtract);
console.log('Patched extractParties');

const oldStandi = `  private executePartyStandiRules(
    ctx: ExecutionContext,
    _claimType: ClaimType,
    _rawText: string,
  ): {
    plaintiffs: string[];
    defendants: string[];
    joinderIssues: string;
    locusStandiSummary: string;
  } {
    // P0-1: Consume Stage 0 atomic facts for party identity
    const partyFacts = Array.from(ctx.factRegistry.values()).filter(
      (f) => f.predicate === "Party Identity" || f.predicate === "Party Role",
    );

    // Extract plaintiff names from Party Identity facts with subject "Plaintiff"
    const plaintiffNames = partyFacts
      .filter((f) => f.subject === "Plaintiff" && f.predicate === "Party Identity" && f.object)
      .map((f) => f.object!)
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe while preserving order

    // Extract defendant names from Party Identity facts with subject "Defendant"
    const defendantNames = partyFacts
      .filter((f) => f.subject === "Defendant" && f.predicate === "Party Identity" && f.object)
      .map((f) => f.object!)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Also extract from Party Role facts
    const rolePlaintiffs = partyFacts
      .filter((f) => f.predicate === "Party Role" && f.object === "PLAINTIFF" && f.object)
      .map((f) => f.subject)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const roleDefendants = partyFacts
      .filter((f) => f.predicate === "Party Role" && f.object === "DEFENDANT" && f.object)
      .map((f) => f.subject)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Merge, with explicit identity facts taking priority
    const plaintiffs = plaintiffNames.length > 0 ? plaintiffNames : rolePlaintiffs;
    const defendants = defendantNames.length > 0 ? defendantNames : roleDefendants;

    const joinderIssues = plaintiffs.length > 1 || defendants.length > 1
      ? "Multiple parties identified; joinder analysis required."
      : "No joinder issues detected.";

    const locusStandiSummary = plaintiffs.length > 0 && defendants.length > 0
      ? \`Plaintiff(s): \${plaintiffs.join(", ")}; Defendant(s): \${defendants.join(", ")}\`
      : "Party standing incomplete — party facts not fully extracted.";

    return { plaintiffs, defendants, joinderIssues, locusStandiSummary };
  }`;

const newStandi = `  private executePartyStandiRules(
    ctx: ExecutionContext,
    _claimType: ClaimType,
    _rawText: string,
  ): {
    plaintiffs: string[];
    defendants: string[];
    joinderIssues: string;
    locusStandiSummary: string;
  } {
    // P0-1: Consume Stage 0 atomic facts for party identity
    const partyFacts = Array.from(ctx.factRegistry.values()).filter(
      (f) => f.predicate === "Party Identity" || f.predicate === "Party Role",
    );

    const plaintiffNames = partyFacts
      .filter((f) => f.subject === "Plaintiff" && f.predicate === "Party Identity" && f.object)
      .map((f) => f.object!)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const defendantNames = partyFacts
      .filter((f) => f.subject === "Defendant" && f.predicate === "Party Identity" && f.object)
      .map((f) => f.object!)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const rolePlaintiffs = partyFacts
      .filter((f) => f.predicate === "Party Role" && f.object === "PLAINTIFF" && f.object)
      .map((f) => f.subject)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const roleDefendants = partyFacts
      .filter((f) => f.predicate === "Party Role" && f.object === "DEFENDANT" && f.object)
      .map((f) => f.subject)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    let plaintiffs = plaintiffNames.length > 0 ? plaintiffNames : rolePlaintiffs;
    let defendants = defendantNames.length > 0 ? defendantNames : roleDefendants;

    // --- NARRATIVE FALLBACK: extract from raw text when fact registry is empty ---
    if (plaintiffs.length === 0) {
      const selfMatch = _rawText.match(/\\bmyself\\s*\\(\\s*([A-Z][a-zA-Z\\s\\.]+?)(?=\\s*(?:,|\\)|aged))/i);
      if (selfMatch) {
        const name = selfMatch[1].trim();
        if (name.length > 2) plaintiffs.push(name);
      }
      const iMatch = _rawText.match(/\\bI\\s*,\\s*([A-Z][a-zA-Z\\s\\.]+?)(?=\\s*(?:,|\\.|aged|son|daughter))/i);
      if (iMatch) {
        const name = iMatch[1].trim();
        if (name.length > 2 && !plaintiffs.includes(name)) plaintiffs.push(name);
      }
    }

    if (defendants.length === 0) {
      const advMatch = _rawText.match(
        /\\b(?:my|our)\\s+(?:brother|sister|son|daughter)\\s+([A-Z][a-zA-Z\\s\\.]+?)(?=\\s+(?:obtained|threatened|refused|denied|sold|alienated|transferred|dispossessed|forcibly|fraudulently|unilaterally))/i
      );
      if (advMatch) {
        const name = advMatch[1].trim();
        if (name.length > 2) defendants.push(name);
      }
    }

    // Co-plaintiff discovery: family members aligned with narrator
    if (plaintiffs.length > 0) {
      const coPlaintiffRegex = /\\bmy\\s+(?:brother|sister|son|daughter|husband|wife)\\s+([A-Z][a-zA-Z\\s\\.]+?)(?=\\s*(?:,|\\(|aged|son|daughter|of|resident))/gi;
      let cm;
      while ((cm = coPlaintiffRegex.exec(_rawText)) !== null) {
        const name = cm[1].trim();
        if (name.length > 2 && !plaintiffs.includes(name) && !defendants.includes(name)) {
          const isAdversarial = new RegExp(
            "\\\\b(?:my|our)\\\\s+(?:brother|sister|son|daughter)\\\\s+" + name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + "\\\\s+(?:obtained|threatened|refused|denied|sold|alienated|transferred|dispossessed|forcibly|fraudulently|unilaterally)",
            "i"
          ).test(_rawText);
          if (!isAdversarial) {
            plaintiffs.push(name);
          }
        }
      }
    }

    const joinderIssues = plaintiffs.length > 1 || defendants.length > 1
      ? "Multiple parties identified; joinder analysis required."
      : "No joinder issues detected.";

    const locusStandiSummary = plaintiffs.length > 0 && defendants.length > 0
      ? \`Plaintiff(s): \${plaintiffs.join(", ")}; Defendant(s): \${defendants.join(", ")}\`
      : "Party standing incomplete — party facts not fully extracted.";

    return { plaintiffs, defendants, joinderIssues, locusStandiSummary };
  }`;

if (!src.includes(oldStandi)) {
  console.error('ERROR: old executePartyStandiRules not found');
  process.exit(1);
}
src = src.replace(oldStandi, newStandi);
console.log('Patched executePartyStandiRules');

fs.writeFileSync(path, src);
console.log('Saved src/engine/BCCAAEngine.ts');
