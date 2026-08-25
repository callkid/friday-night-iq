# Friday Night IQ

Live offensive charting and Game IQ for high-school football staffs.

Candidate production release: **Quality24 press-box speed + confidence-first Game IQ**.

Quality24 keeps the certified football engine, state schema, recovery keys, penalty math, scoring, pick-six behavior, formation reset, personnel carry, and motion reset semantics. It improves the live tracker with one-tap Coverage, Motion, Run/Pass Detail, and Concept Family controls, a Hurry-Up mode, charting completeness feedback, a repacked After the Snap area, penalty Save docking, and confidence-aware Game IQ recommendations.

The press-box layout now treats wasted space and desktop page scrolling as QA failures. Normal charting is required to stay in one viewport at the core coach desktop sizes, while the live IQ sidebar scrolls internally when needed.

Certification requires:
- full source/regression QA
- core browser E2E
- Quality24 speed/confidence browser E2E
- press-box tracker workflow: 3/3
- pick-six browser path
- responsive matrix: 1475x668, 1366x768, 1660x900 tracker workstation, 1920x1080, 2560x1440, 1024x768, tablet, mobile portrait, mobile landscape
- zero main-page scroll at 1475x668, 1366x768, 1660x900, and 1920x1080 normal desktop tracker cases
- dead-space gap under Pre-Snap <= 18px
- no horizontal overflow
- no Save overlap; penalty Save remains reachable in-panel
- Game IQ avoids strong recommendations from tiny or unsuccessful samples

Production QA rerun: 1.
