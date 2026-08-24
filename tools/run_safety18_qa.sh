#!/usr/bin/env bash
set -euo pipefail
REPORT=qa-safety18-proof.txt
: > "$REPORT"
run(){ label="$1"; shift; echo "=== $label ===" | tee -a "$REPORT"; "$@" 2>&1 | tee -a "$REPORT"; echo "PASS: $label" | tee -a "$REPORT"; echo | tee -a "$REPORT"; }
run_shell(){ label="$1"; shift; echo "=== $label ===" | tee -a "$REPORT"; bash -lc "$*" 2>&1 | tee -a "$REPORT"; echo "PASS: $label" | tee -a "$REPORT"; echo | tee -a "$REPORT"; }
run_shell "JavaScript syntax sweep" 'for f in *.js; do node --check "$f"; done'
run "Game-state smoke" node qa-smoke.js
run "Durability" node qa-durability.js
run "Settings" node qa-settings.js
run "Relational analytics" node qa-analytics-relations.js
run "Booth workflow" node qa-booth-workflow.js
run "Game IQ search" node qa-game-iq-search.js
run "QB facets" node qa-qb-facets.js
run "Coach language" node qa-coach-language.js
run "Game-day regression" node qa-game-day-fixes.js
run "Game IQ 2" node qa-game-iq-pro.js
run "Game IQ destructive" node qa-game-iq-pro-destructive.js
run "First-down and Saved Views" node qa-game-iq-polish.js
run "Game IQ 1000-cycle stability" node qa-game-iq-stability.js
run "Destructive beta" node qa-destructive-beta.js
run "Safety18 live correction" node qa-live-correction.js
run "Safety18 quick stats drilldowns" node qa-game-iq-summary.js
run_shell "Safety18 release architecture" 'grep -q "live-correction.js" app.js && grep -q "live-runtime-stability.js" app.js && grep -q "game-iq-summary.js" app.js && ! grep -q "game-day-3.js" app.js && ! grep -q "speed-guard.js" app.js && ! grep -q "game-iq-v3.js" app.js && grep -q "v=safety18" app.js && grep -q "app.js?v=safety18" index.html && grep -q "fniq_prod_v1" state.js && grep -q "fniq_recovery_v1" durability.js'
run_shell "Football preset contract" 'grep -q "False Start.*Offense.*Accepted.*5.*REPEAT.*DEAD" game-customization.js && grep -q "Offside.*Defense.*Accepted.*5.*REPEAT.*DEAD" game-customization.js && grep -q "Encroachment.*Defense.*Accepted.*5.*REPEAT.*DEAD" game-customization.js && grep -q "Delay of Game.*Offense.*Accepted.*5.*REPEAT.*DEAD" game-customization.js'
run_shell "No observer regression in new layers" '! grep -q "MutationObserver" live-correction.js && ! grep -q "MutationObserver" live-runtime-stability.js && ! grep -q "MutationObserver" game-iq-summary.js'
run "Static DOM references" node qa-static-dom.js
run_shell "Code size" 'wc -l *.js *.css index.html | tail -1'
echo "FINAL: PASS" | tee -a "$REPORT"
