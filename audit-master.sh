#!/bin/bash
# BCCAA Engine — Complete Audit Suite
# Run: bash audit-master.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     BCCAA ENGINE — COMPLETE AUDIT SUITE                    ║"
echo "║     P0 Engine Correctness | P1 Determinism | P2 Legal      ║"
echo "║     Security & Hygiene                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

START_TIME=$(date +%s)

# Make scripts executable
chmod +x audit-static.cjs audit-determinism.cjs audit-fail-closed.cjs audit-legal-pipeline.cjs audit-hygiene.sh 2>/dev/null || true

# ── P0: Static Analysis ──────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  P0 — STATIC ANALYSIS (null/undefined/any/mutation)"
echo "═══════════════════════════════════════════════════════════════"
node audit-static.cjs || echo "⚠️  Static audit exited with errors"

# ── P0: Fail-Closed Guarantees ───────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  P0 — FAIL-CLOSED GUARANTEES"
echo "═══════════════════════════════════════════════════════════════"
node audit-fail-closed.cjs || echo "⚠️  Fail-closed audit exited with errors"

# ── P1: Determinism & Isolation ─────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  P1 — DETERMINISM & ISOLATION STRESS TEST"
echo "═══════════════════════════════════════════════════════════════"
node audit-determinism.cjs || echo "⚠️  Determinism audit exited with errors"

# ── P2: Deep Legal Pipeline ─────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  P2 — DEEP LEGAL PIPELINE AUDIT"
echo "═══════════════════════════════════════════════════════════════"
node audit-legal-pipeline.cjs || echo "⚠️  Legal pipeline audit exited with errors"

# ── Security & Hygiene ──────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECURITY & REPOSITORY HYGIENE"
echo "═══════════════════════════════════════════════════════════════"
bash audit-hygiene.sh || echo "⚠️  Hygiene audit exited with errors"

# ── Summary ─────────────────────────────────────────────────────
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    AUDIT COMPLETE                            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  Duration: %-49s ║\n" "${DURATION}s"
echo "║                                                              ║"
echo "║  Reports generated:                                          ║"
echo "║    • audit-static-report.cjson                                ║"
echo "║    • audit-fail-closed-report.cjson                           ║"
echo "║    • audit-determinism-report.cjson                           ║"
echo "║    • audit-legal-pipeline-report.cjson                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Review JSON reports for failures"
echo "  2. Fix P0 issues first (engine correctness)"
echo "  3. Re-run: bash audit-master.sh"
