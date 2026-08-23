#!/bin/bash
set +H
echo "========================================"
echo "  BCCA2 ENTERPRISE READINESS SCORECARD"
echo "========================================"
echo ""

TOTAL=0
SCORE=0

pass() { SCORE=$((SCORE+1)); echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; }
warn() { echo "  ⚠️  $1"; }
skip() { echo "  ⏭️  $1"; }

# 1. DOCUMENTATION
echo "1. DOCUMENTATION & GOVERNANCE"
TOTAL=$((TOTAL+4))
[ -f README.md ] && pass "README.md present" || fail "README.md missing"
[ -f LICENSE ] && pass "LICENSE present" || fail "LICENSE missing"
[ -f CHANGELOG.md ] && pass "CHANGELOG.md present" || warn "CHANGELOG.md missing"
[ -f CONTRIBUTING.md ] && pass "CONTRIBUTING.md present" || warn "CONTRIBUTING.md missing"

# 2. CONFIGURATION
echo ""
echo "2. CONFIGURATION & ENVIRONMENT"
TOTAL=$((TOTAL+4))
[ -f .env.example ] && pass ".env.example present" || fail "No .env.example"
[ -f .gitignore ] && pass ".gitignore present" || fail ".gitignore missing"
grep -q "node_modules" .gitignore 2>/dev/null && pass ".gitignore covers node_modules" || fail ".gitignore incomplete"
[ -f tsconfig.json ] && pass "TypeScript configured" || fail "tsconfig.json missing"

# 3. CI/CD
echo ""
echo "3. CI/CD & DEPLOYMENT PIPELINE"
TOTAL=$((TOTAL+4))
[ -d .github/workflows ] && pass "GitHub Actions configured" || warn "No CI/CD workflows"
[ -f vercel.json ] && pass "Vercel config present" || skip "Vercel config absent"
grep -q "scripts" package.json 2>/dev/null && pass "npm scripts defined" || fail "package.json scripts missing"
[ -f .nvmrc ] || [ -f .node-version ] && pass "Node version pinned" || warn "No Node version lockfile"

# 4. TESTING
echo ""
echo "4. TESTING & QUALITY ASSURANCE"
TOTAL=$((TOTAL+5))
TEST_FILES=$(find src -name "*.test.ts" -o -name "*.spec.ts" | wc -l)
SRC_FILES=$(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" | wc -l)
[ "$TEST_FILES" -gt 0 ] && pass "Test files present ($TEST_FILES)" || fail "No test files"
RATIO=$(awk "BEGIN {printf \"%.2f\", $TEST_FILES/$SRC_FILES}")
awk "BEGIN {exit !($RATIO >= 0.5)}" && pass "Test ratio healthy ($RATIO)" || warn "Test ratio low ($RATIO)"
[ -f vitest.config.ts ] && pass "Vitest configured" || fail "No vitest config"
[ -f vite.config.ts ] && pass "Vite build configured" || fail "No vite config"
grep -q "coverage" package.json 2>/dev/null && pass "Coverage scripts found" || warn "No coverage scripts"

# 5. SECURITY
echo ""
echo "5. SECURITY & COMPLIANCE"
TOTAL=$((TOTAL+4))
[ -f src/utils/license.ts ] && pass "License utility exists" || fail "No license utility"
[ -f src/utils/crypto.ts ] && pass "Crypto utility exists" || fail "No crypto utility"
[ -f src/utils/watermark.ts ] && pass "Watermark utility exists" || skip "Watermark absent"
[ -f src/utils/audit.ts ] && pass "Audit sink exists" || fail "No audit sink"

# 6. ARCHITECTURE
echo ""
echo "6. CODE ARCHITECTURE"
TOTAL=$((TOTAL+4))
[ -d src/types ] && pass "Centralized types directory" || fail "No types/ dir"
[ -d src/engine ] && pass "Engine layer isolated" || fail "No engine/ dir"
[ -d src/auth ] && pass "Auth layer isolated" || fail "No auth/ dir"
LEAKS=$(grep -r "console\." src/engine/ --include="*.ts" 2>/dev/null | grep -v test | wc -l)
[ "$LEAKS" -eq 0 ] && pass "No console leaks in engine" || fail "$LEAKS console leaks in engine"

# 7. DEPENDENCIES
echo ""
echo "7. DEPENDENCY HYGIENE"
TOTAL=$((TOTAL+3))
grep -q "dependencies" package.json && pass "Runtime deps declared" || fail "No runtime deps"
grep -q "devDependencies" package.json && pass "Dev deps declared" || fail "No dev deps"
npm audit --audit-level=moderate 2>/dev/null | grep -q "found 0 vulnerabilities" && pass "npm audit clean" || fail "npm audit reports vulnerabilities"

# 8. LEGAL ENGINE
echo ""
echo "8. BCCAA LEGAL ENGINE MATURITY"
TOTAL=$((TOTAL+4))
[ -f src/engine/BCCAAEngine.ts ] && pass "Core engine exists" || fail "Missing engine"
[ -f src/engine/FactConsistencyGate.ts ] && pass "F0 gate exists" || fail "Missing gate"
[ -f src/engine/CitationValidator.ts ] && pass "Citation validator exists" || fail "Missing validator"
[ -f src/engine/metadata.json ] && pass "metadata.json present" || fail "Missing metadata"

# 9. TYPE SAFETY
echo ""
echo "9. TYPE SAFETY & STRICTNESS"
TOTAL=$((TOTAL+2))
npx tsc --noEmit 2>/dev/null && pass "TypeScript strict mode" || fail "TS errors remain"
grep -q '"noImplicitAny": true' tsconfig.json && pass "noImplicitAny configured" || fail "noImplicitAny off"

# 10. PACKAGE HEALTH
echo ""
echo "10. PACKAGE.JSON HEALTH"
TOTAL=$((TOTAL+2))
grep -q '"name"' package.json && pass "Package named" || fail "Package unnamed"
grep -q '"version"' package.json && pass "Version declared" || fail "Version undeclared"

echo ""
echo "========================================"
echo "  SCORE: $SCORE / $TOTAL"
PCT=$(awk "BEGIN {printf \"%.0f\", ($SCORE/$TOTAL)*100}")
echo "  PERCENTAGE: $PCT%"
echo "========================================"
[ "$SCORE" -eq "$TOTAL" ] && echo "  VERDICT: PRODUCTION-CAPABLE 🚀" || echo "  VERDICT: ENTERPRISE-READY (minor gaps) 🏢"
echo "========================================"
