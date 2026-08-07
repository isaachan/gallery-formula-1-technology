# US-H02 Route Family Performance Audit

- Date: 2026-08-07T02:48:10.826Z
- Execution profile: local production build served by `next start`, Lighthouse mobile emulation at 390px width
- Samples per route: 2
- Budgets: LCP <= 2500 ms, INP <= 200 ms, CLS <= 0.100, initial route script <= 200.0 KB, initial image bytes <= 500.0 KB

| Route Family | Path | LCP | INP | CLS | Script Bytes | Image Bytes | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| timeline-home | `/` | 2497 ms | 20 ms (TBT proxy) | 0.000 | 173.0 KB | 0.0 KB | Pass |
| season-detail | `/seasons/1988` | 3003 ms | 56 ms (TBT proxy) | 0.000 | 179.5 KB | 210.3 KB | Pass (Exception) |
| museum | `/museum` | 2401 ms | 86 ms (TBT proxy) | 0.000 | 177.4 KB | 0.0 KB | Pass |
| car-detail | `/cars/mclaren-mp4-4` | 2853 ms | 12 ms (TBT proxy) | 0.000 | 178.0 KB | 141.9 KB | Pass (Exception) |
| person-detail | `/people/ayrton-senna` | 2480 ms | 15 ms (TBT proxy) | 0.000 | 167.4 KB | 68.3 KB | Pass |
| technology-detail | `/technologies/honda-ra168e` | 2631 ms | 22 ms (TBT proxy) | 0.000 | 169.9 KB | 10.4 KB | Pass (Exception) |

## Notes

- This audit measures representative route families instead of every single published entity route.
- Subject-page coverage uses the real 1988 reference content for car, person, and technology pages.
- Each route is sampled 2 times and the median is compared against the PRD mobile budgets.
- When Lighthouse does not emit INP, the script falls back to Total Blocking Time and records that explicitly.

## Exceptions / Technical Debt

### Approved temporary exceptions

- season-detail (/seasons/1988) lcp: actual 3003 ms vs PRD budget 2500 ms; approved cap 3200 ms; owner @isaachan; severity high; target 2026-08; justification: Season detail stays usable but exceeds current LCP budget with expanded season content.
- car-detail (/cars/mclaren-mp4-4) lcp: actual 2853 ms vs PRD budget 2500 ms; approved cap 4200 ms; owner @isaachan; severity high; target 2026-08; justification: Car detail route remains functional but is currently over LCP budget with full content payload.
- technology-detail (/technologies/honda-ra168e) lcp: actual 2631 ms vs PRD budget 2500 ms; approved cap 3200 ms; owner @isaachan; severity high; target 2026-08; justification: Technology page has acceptable usability but exceeds LCP budget in CI simulation.

### Blocking exceptions

- None
