#!/usr/bin/env bash
set +e
REPORT=qa-gd3-proof.txt
: > "$REPORT"
FAIL=0
run_case(){
  LABEL="$1"; shift
  echo "=== $LABEL ===" | tee -a "$REPORT"
  "$@" >> "$REPORT" 2>&1
  CODE=$?
  if [ $CODE -eq 0 ]; then echo "PASS: $LABEL" | tee -a "$REPORT"; else echo "FAIL($CODE): $LABEL" | tee -a "$REPORT"; FAIL=1; fi
  echo >> "$REPORT"
}
run_shell(){
  LABEL="$1"; shift
  CMD="$*"
  echo "=== $LABEL ===" | tee -a "$REPORT"
  bash -lc "$CMD" >> "$REPORT" 2>&1
  CODE=$?
  if [ $CODE -eq 0 ]; then echo "PASS: $LABEL" | tee -a "$REPORT"; else echo "FAIL($CODE): $LABEL" | tee -a "$REPORT"; FAIL=1; fi
  echo >> "$REPORT"
}
run_shell "JavaScript syntax sweep" 'for f in *.js; do node --check "$f" || exit 1; done'
run_case "Game-state smoke" node qa-smoke.js
run_case "Durability" node qa-durability.js
run_case "Settings" node qa-settings.js
run_case "Relational analytics" node qa-analytics-relations.js
run_case "Booth workflow" node qa-booth-workflow.js
run_case "Game IQ search" node qa-game-iq-search.js
run_case "QB facets" node qa-qb-facets.js
run_case "Coach language" node qa-coach-language.js
run_case "Legacy game-day fixes" node qa-game-day-fixes.js
run_case "Game IQ 2" node qa-game-iq-pro.js
run_case "Game IQ 2 destructive" node qa-game-iq-pro-destructive.js
run_case "First-down/Saved Views" node qa-game-iq-polish.js
run_case "Legacy IQ stability" node qa-game-iq-stability.js
run_case "Destructive beta" node qa-destructive-beta.js
run_case "Game-Day 3 speed/state" node qa-game-day-3.js
run_case "Game IQ 3 canonical/stress" node qa-game-iq-v3.js
run_shell "Release/data safety" 'grep -q "fniq_prod_v1" state.js && grep -q "fniq_recovery_v1" durability.js && grep -q "game-day-3.js" app.js && grep -q "game-iq-v3.js" app.js && grep -q "v=safety16" app.js && grep -q "app.js?v=safety16" index.html && grep -q "officialNext" game-engine.js && grep -q "if(added&&!A.__gameDay3)" game-day-fixes.js && grep -q "Where is the ball now?" game-day-3.js && grep -q "Pick Six / INT returned for TD" game-day-3.js && grep -q "OFFICIAL NEXT SNAP" game-day-3.js && grep -q "One-glance game stats" game-iq-v3.js && grep -q "A.getIQFilters" game-iq-v3.js && grep -q "A.setIQFilters" game-iq-v3.js && grep -q "1st & 10" game-iq-v3.js && ! grep -q "MutationObserver" game-day-3.js && ! grep -q "MutationObserver" game-iq-v3.js && ! grep -q "2nd: 70%" index.html && ! grep -q "15+ net yards or tagged" analytics.js && grep -q "C.makePayload(A.state,'"'"'safety16'"'"')" durability.js'
run_shell "Static DOM refs" 'python - <<"PY"
from pathlib import Path
import re
html=Path("index.html").read_text()
ids=set(re.findall(r"id=\"([^\"]+)\"",html))
refs=set()
for f in ["ui.js","analytics.js","export.js"]:
    s=Path(f).read_text()
    refs.update(re.findall(r"\$\('"'"'([^'"'"']+)'"'"'\)",s))
    refs.update(re.findall(r"\$\(\"([^\"]+)\"\)",s))
missing=sorted(refs-ids)
if missing: raise SystemExit("missing="+str(missing))
print("Static DOM references clean")
PY'
if [ $FAIL -eq 0 ]; then
  echo "FINAL: PASS" | tee -a "$REPORT"
else
  echo "FINAL: FAIL" | tee -a "$REPORT"
fi
exit $FAIL
