#!/usr/bin/env bash
set -euo pipefail
REPORT=qa-safety23-proof.txt
: > "$REPORT"
run(){ label="$1"; shift; echo "=== $label ===" | tee -a "$REPORT"; "$@" 2>&1 | tee -a "$REPORT"; echo "PASS: $label" | tee -a "$REPORT"; echo | tee -a "$REPORT"; }
run_shell(){ label="$1"; shift; echo "=== $label ===" | tee -a "$REPORT"; bash -lc "$*" 2>&1 | tee -a "$REPORT"; echo "PASS: $label" | tee -a "$REPORT"; echo | tee -a "$REPORT"; }
run_shell "JavaScript syntax sweep" 'for f in *.js; do node --check "$f"; done'
run "Game-state smoke" node qa-smoke.js
run "Durability" node qa-durability.js
run "Settings" node qa-settings.js
run "Relational analytics" node qa-analytics-relations.js
run "Booth workflow" node qa-booth-workflow.js
run "Penalty hardening" node qa-penalty-hardening.js
run "Prior-request regression contract" node qa-history-regression.js
run "Game IQ search" node qa-game-iq-search.js
run "QB facets" node qa-qb-facets.js
run "Coach language" node qa-coach-language.js
run "Game-day regression" node qa-game-day-fixes.js
run "Game IQ 2" node qa-game-iq-pro.js
run "Game IQ destructive" node qa-game-iq-pro-destructive.js
run "First-down and Saved Views" node qa-game-iq-polish.js
run "Game IQ 1000-cycle stability" node qa-game-iq-stability.js
run "Destructive beta" node qa-destructive-beta.js
run "Live correction" node qa-live-correction.js
run "Quick stats drilldowns" node qa-game-iq-summary.js
run_shell "Safety23 release architecture" 'grep -q "tooltip-polish.js" app.js && grep -q "penalty-hardening.js" app.js && grep -q "run-type-stability.js" app.js && grep -q "pick-six.js" app.js && grep -q "live-correction.js" app.js && grep -q "box-ui-v19.js" app.js && grep -q "game-iq-summary.js" app.js && ! grep -q "game-day-3.js" app.js && ! grep -q "speed-guard.js" app.js && ! grep -q "game-iq-v3.js" app.js && grep -q "v=safety23" app.js && grep -q "app.js?v=safety23" index.html && grep -q "box-ui-v19.css?v=box23" box-ui-v19.js && grep -q "visual-polish.css?v=visual23" box-ui-v19.js && grep -q "adaptive-layout.css?v=adaptive23c" box-ui-v19.js && grep -q "pick-six.css?v=pick22" pick-six.js && grep -q "fniq_prod_v1" state.js && grep -q "fniq_recovery_v1" durability.js'
run_shell "Football preset contract" 'grep -q "False Start.*Offense.*Accepted.*5.*REPEAT.*DEAD" penalty-hardening.js && grep -q "Offside.*Defense.*Accepted.*5.*REPEAT.*DEAD" penalty-hardening.js && grep -q "Encroachment.*Defense.*Accepted.*5.*REPEAT.*DEAD" penalty-hardening.js && grep -q "Delay of Game.*Offense.*Accepted.*5.*REPEAT.*DEAD" penalty-hardening.js'
run_shell "Run Type stability contract" 'grep -q "Inside Zone" run-type-stability.js && grep -q "Outside Zone" run-type-stability.js && grep -q "Counter" run-type-stability.js && grep -q "Power" run-type-stability.js && grep -q "Draw" run-type-stability.js && grep -q "Run Type" run-type-stability.js'
run_shell "Compact important-field contract" 'grep -q "boxSecondaryLookRow" box-ui-v19.js && grep -q "motion" box-ui-v19.js && grep -q "resets each play" box-ui-v19.js && grep -q "boxMainGrid" box-ui-v19.js && grep -q "primary tracker control off-screen" qa-browser-e2e.js && grep -q "position:fixed" box-ui-v19.css'
run_shell "Adaptive viewport contract" 'grep -q "width:1475,height:668" qa-browser-responsive.js && grep -q "width:1920,height:1080" qa-browser-responsive.js && grep -q "width:2560,height:1440" qa-browser-responsive.js && grep -q "grid-auto-rows:max-content" adaptive-layout.css && grep -q "max-height:700px" adaptive-layout.css && grep -q "min-width:1600px" adaptive-layout.css && grep -q "overflow-y:auto" adaptive-layout.css && grep -q "position:static!important" adaptive-layout.css && grep -q "shortSituationEdit" box-ui-v19.js && grep -q "boxHeaderSave" box-ui-v19.js'
run_shell "Light-mode contract" 'grep -Fq "html[data-theme=\"light\"] #penaltyPanel.boxPenaltyInline" box-ui-v19.css && grep -q "Quick Game Stats values must remain readable in light mode" qa-browser-e2e.js'
run_shell "Historical UX contract" 'grep -q "DELAY=3200" tooltip-polish.js && grep -q "Save for quick access" game-iq-polish.js && grep -q "Returned for TD" pick-six.js && grep -q "explosiveRun" analytics.js && grep -q "explosivePass" analytics.js && grep -q "#iq .action.good" visual-polish.css && grep -q "#iq .action.bad" visual-polish.css'
run_shell "No broad observer regression in new layers" '! grep -q "MutationObserver" live-correction.js && ! grep -q "MutationObserver" live-runtime-stability.js && ! grep -q "MutationObserver" box-ui-v19.js && ! grep -q "MutationObserver" penalty-hardening.js && ! grep -q "MutationObserver" run-type-stability.js && ! grep -q "MutationObserver" game-iq-summary.js'
run "Static DOM references" node qa-static-dom.js
run_shell "Code size" 'wc -l *.js *.css index.html | tail -1'
echo "FINAL: PASS" | tee -a "$REPORT"
