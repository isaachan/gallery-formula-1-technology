# US-H02 Route Family Performance Audit

- Date: 2026-07-22T06:31:10.785Z
- Execution profile: local production build served by `next start`, Lighthouse mobile emulation at 390px width
- Samples per route: 2
- Budgets: LCP <= 2500 ms, INP <= 200 ms, CLS <= 0.100, initial route script <= 200.0 KB, initial image bytes <= 500.0 KB

| Route Family | Path | LCP | INP | CLS | Script Bytes | Image Bytes | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| timeline-home | `/` | 2474 ms | 45 ms (TBT proxy) | 0.000 | 170.1 KB | 0.0 KB | Pass |
| season-detail | `/seasons/1988` | 2556 ms | 47 ms (TBT proxy) | 0.000 | 183.2 KB | 397.0 KB | Fail |
| museum | `/museum` | 2397 ms | 76 ms (TBT proxy) | 0.000 | 173.9 KB | 0.0 KB | Pass |
| car-detail | `/cars/mclaren-mp4-4` | 3753 ms | 32 ms (TBT proxy) | 0.000 | 174.0 KB | 300.8 KB | Fail |
| person-detail | `/people/ayrton-senna` | 2182 ms | 21 ms (TBT proxy) | 0.000 | 164.5 KB | 0.0 KB | Pass |
| technology-detail | `/technologies/honda-ra168e` | 2782 ms | 19 ms (TBT proxy) | 0.000 | 166.8 KB | 10.4 KB | Fail |

## Notes

- This audit measures representative route families instead of every single published entity route.
- Subject-page coverage uses the real 1988 reference content for car, person, and technology pages.
- Each route is sampled 2 times and the median is compared against the PRD mobile budgets.
- When Lighthouse does not emit INP, the script falls back to Total Blocking Time and records that explicitly.

## Exceptions / Technical Debt

- season-detail (/seasons/1988) exceeded one or more budgets
- car-detail (/cars/mclaren-mp4-4) exceeded one or more budgets
- technology-detail (/technologies/honda-ra168e) exceeded one or more budgets
