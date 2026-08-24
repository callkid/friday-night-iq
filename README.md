# Friday Night IQ

Live offensive charting and Game IQ for high-school football staffs.

Current production release: **safety22 regression-audit + press-box polish release**.

Safety22 restores formation reset behavior, hardens penalty repeat-down rules, adds light-mode coverage, restores pick-six scoring, preserves prior Game IQ/Skyridge charting features, keeps saved Game 1 data compatible, and condenses the main live tracker without replacing the proven football state engine.

Final QA certification: **PASS**.
- Source/regression QA: PASS
- Real browser press-box QA: 3/3 PASS
- Pick-six browser path: PASS
- Production cache: `safety22-final`

Deployment commit intentionally follows the passing QA proof so GitHub Pages rebuilds from the certified release.
