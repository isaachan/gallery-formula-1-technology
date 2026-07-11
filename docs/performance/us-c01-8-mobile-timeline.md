# US-C01.8 Mobile Timeline Performance Audit

- Date: 2026-07-11T09:50:33.150Z
- Route: `/`
- Execution profile: local production build served by `next start`, audited with Lighthouse mobile emulation against widths 320px, 390px, and 430px
- Budgets: LCP <= 2500 ms, INP <= 200 ms, CLS <= 0.100, initial route script <= 200.0 KB, initial image bytes <= 500.0 KB

| Width | LCP | INP | CLS | Script Bytes | Image Bytes | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 320px | 2481 ms | 11 ms (TBT proxy) | 0.000 | 157.6 KB | 16.3 KB | Pass |
| 390px | 2481 ms | 11 ms (TBT proxy) | 0.000 | 157.6 KB | 16.3 KB | Pass |
| 430px | 2481 ms | 11 ms (TBT proxy) | 0.000 | 157.6 KB | 16.3 KB | Pass |

## Notes

- The audit covers the current 76-season demo timeline shell at the required mobile widths. Epic G will replace the demo season labels with researched repository content later without changing the timeline geometry or interaction model.
- Lighthouse lab metrics are the repo's current agreed approximation for the PRD's mobile performance gate before production field telemetry exists.
- Each width is sampled 3 times and budget checks use the median result to reduce single-run jitter.
- When Lighthouse does not emit an INP value for a run, the script falls back to Total Blocking Time as the conservative lab proxy and marks that explicitly in the report.

## Exceptions / Technical Debt

- None
