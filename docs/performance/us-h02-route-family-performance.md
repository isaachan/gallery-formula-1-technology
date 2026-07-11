# US-H02 Route Family Performance Audit

- Date: 2026-07-11T15:04:26.838Z
- Execution profile: local production build served by `next start`, Lighthouse mobile emulation at 390px width
- Samples per route: 2
- Budgets: LCP <= 2500 ms, INP <= 200 ms, CLS <= 0.100, initial route script <= 200.0 KB, initial image bytes <= 500.0 KB

| Route Family | Path | LCP | INP | CLS | Script Bytes | Image Bytes | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| timeline-home | `/` | 2191 ms | 14 ms (TBT proxy) | 0.000 | 161.1 KB | 0.0 KB | Pass |
| season-detail | `/seasons/1988` | 2037 ms | 14 ms (TBT proxy) | 0.000 | 157.3 KB | 0.0 KB | Pass |
| museum | `/museum` | 2187 ms | 16 ms (TBT proxy) | 0.000 | 155.0 KB | 0.0 KB | Pass |
| car-detail | `/cars/mclaren-mp4-4` | 2182 ms | 13 ms (TBT proxy) | 0.000 | 161.6 KB | 0.0 KB | Pass |
| person-detail | `/people/ayrton-senna` | 2183 ms | 14 ms (TBT proxy) | 0.000 | 161.6 KB | 0.0 KB | Pass |
| technology-detail | `/technologies/honda-ra168e` | 2336 ms | 16 ms (TBT proxy) | 0.000 | 161.6 KB | 10.6 KB | Pass |

## Notes

- This audit measures representative route families instead of every single published entity route.
- Subject-page coverage uses the real 1988 reference content for car, person, and technology pages.
- Each route is sampled 2 times and the median is compared against the PRD mobile budgets.
- When Lighthouse does not emit INP, the script falls back to Total Blocking Time and records that explicitly.

## Exceptions / Technical Debt

- None
