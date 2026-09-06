#!/usr/bin/env bash
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || { echo "Not a git repo root"; exit 1; }

echo "=== BRANCH / HEAD ==="
git branch --show-current
git log -1 --oneline
echo "=== WORKING TREE STATUS (should be empty) ==="
git status --short

echo "=== CREATE AUDIT BRANCH ==="
git checkout main 2>&1
git pull 2>&1
git checkout -b "audit/deep-$(date +%Y%m%d-%H%M%S)" 2>&1

echo "=== CSRF PROTECTION CHECK ==="
grep -RInE 'csrf|CSRF|sameSite|SameSite' src server --include='*.ts' --include='*.tsx' 2>/dev/null || echo "NO MATCHES — verify manually"

echo "=== RATE LIMITING CHECK ==="
grep -RInE 'rateLimit|rate-limit|express-rate-limit|slowDown|throttl' src server --include='*.ts' 2>/dev/null || echo "NO MATCHES — verify manually"

echo "=== HARDCODED SECRETS SCAN ==="
grep -RInE '(api[_-]?key|secret|password|token)\s*[:=]\s*["'"'"'][A-Za-z0-9+/_-]{12,}["'"'"']' src server --include='*.ts' --include='*.tsx' 2>/dev/null || echo "NO MATCHES"

echo "=== ILRMF VERDICT BAND CHECK (GREEN/YELLOW/RED/BLACK) ==="
grep -RInE '\bGREEN\b|\bYELLOW\b|\bRED\b|\bBLACK\b' src server --include='*.ts' --include='*.tsx' 2>/dev/null || echo "NO MATCHES — ILRMF verdict architecture absent from this repo"

echo "=== RULE / CORPUS DATA FILES (excluding node_modules, non-code) ==="
find . -path ./node_modules -prune -o -type f \( -iname '*rule*' -o -iname '*corpus*' -o -iname '*statute*' \) -print 2>/dev/null

echo "=== CORPUS MODE / AUTHORITY STATUS DEFAULTS ==="
grep -RInE 'corpusMode|authorityStatus|VALIDATED_PRODUCTION|DEVELOPMENT_FIXTURE' src server --include='*.ts' 2>/dev/null

echo "=== DEPENDENCY AUDIT ==="
npm audit --production 2>&1 || true

echo "=== OUTDATED DEPENDENCIES ==="
npm outdated 2>&1 || true

echo "=== TYPECHECK (explicit exit code capture) ==="
npx tsc --noEmit 2>&1
echo "tsc exit code: $?"

echo "=== FULL TEST SUITE (explicit exit code capture) ==="
npx vitest run 2>&1
echo "vitest exit code: $?"

echo "=== BUILD ==="
npm run build 2>&1
echo "build exit code: $?"
du -sh dist/assets/*.js 2>/dev/null

echo "=== PACKAGE METADATA SANITY ==="
grep -E '"name"|"version"' package.json

echo "=== FINAL GIT STATUS (confirm no source changes) ==="
git status --short
git branch --show-current

echo "=== DONE — audit branch created, no commits made ==="
