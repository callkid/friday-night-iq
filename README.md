# Friday Night IQ

Live offensive charting and Game IQ for high-school football staffs.

Candidate production release: **safety23 adaptive press-box layout**.

Safety23 keeps the certified safety22 football logic and adds responsive layout by both viewport width and height. It specifically targets the coach's short laptop viewport, prevents the live IQ sidebar from stretching the charting grid, removes dead vertical gaps, keeps the Save row from covering controls on short screens, expands deliberately on 1080p/2K monitors, and preserves all tracked football fields.

Certification requires:
- full source/regression QA
- real browser press-box QA: 3/3
- pick-six browser path
- responsive matrix: 1475x668, 1366x768, 1920x1080, 2560x1440, 1024x768
- no horizontal overflow
- no dead gap after Situation
- no Save-row overlap at the short-laptop viewport
