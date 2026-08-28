#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     SECURITY & HYGIENE AUDIT                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"

echo ""
echo "── console.log statements ──────────────────────────────────────"
if grep -rn "console\.log" src/ --include="*.ts"; then
  echo "Found console.log statements"
else
  echo "✓ No console.log in source"
fi

echo ""
echo "── TODO / FIXME / HACK / XXX markers ──────────────────────────"
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" || true

echo ""
echo "── 'as any' casts ─────────────────────────────────────────────"
grep -rn "as any" src/ --include="*.ts" || true

echo ""
echo "── Hardcoded dates in source ──────────────────────────────────"
grep -rnE "[0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}" src/ --include="*.ts" | grep -vE "test|spec" || true

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    AUDIT COMPLETE                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
