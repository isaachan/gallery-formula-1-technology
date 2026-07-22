# US-H02 Route Family Performance Audit

- Date: 2026-07-22T09:25:47.435Z
- Execution profile: local production build served by `next start`, Lighthouse mobile emulation at 390px width
- Samples per route: 2
- Budgets: LCP <= 2500 ms, INP <= 200 ms, CLS <= 0.100, initial route script <= 200.0 KB, initial image bytes <= 500.0 KB

| Route Family | Path | LCP | INP | CLS | Script Bytes | Image Bytes | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| timeline-home | `/` | 2630 ms | 145 ms (TBT proxy) | 0.000 | 170.1 KB | 0.0 KB | Pass (Exception) |
| season-detail | `/seasons/1988` | 2556 ms | 89 ms (TBT proxy) | 0.000 | 183.2 KB | 397.0 KB | Pass (Exception) |
| museum | `/museum` | 2531 ms | 54 ms (TBT proxy) | 0.000 | 173.9 KB | 0.0 KB | Pass (Exception) |
| car-detail | `/cars/mclaren-mp4-4` | 3752 ms | 26 ms (TBT proxy) | 0.000 | 174.0 KB | 300.8 KB | Pass (Exception) |
| person-detail | `/people/ayrton-senna` | 2180 ms | 23 ms (TBT proxy) | 0.000 | 164.5 KB | 0.0 KB | Pass |
| technology-detail | `/technologies/honda-ra168e` | 2781 ms | 14 ms (TBT proxy) | 0.000 | 166.8 KB | 10.4 KB | Pass (Exception) |

## Notes

- This audit measures representative route families instead of every single published entity route.
- Subject-page coverage uses the real 1988 reference content for car, person, and technology pages.
- Each route is sampled 2 times and the median is compared against the PRD mobile budgets.
- When Lighthouse does not emit INP, the script falls back to Total Blocking Time and records that explicitly.

## Exceptions / Technical Debt

### Approved temporary exceptions

- timeline-home (/) lcp: actual 2630 ms vs PRD budget 2500 ms; approved cap 3000 ms; owner @isaachan; severity medium; target 2026-08; justification: Current repository scale (1950-2025 full static set) keeps the timeline route usable but exceeds PRD LCP target in CI lab runs.
- season-detail (/seasons/1988) lcp: actual 2556 ms vs PRD budget 2500 ms; approved cap 3200 ms; owner @isaachan; severity high; target 2026-08; justification: Season detail stays usable but exceeds current LCP budget with expanded season content.
- museum (/museum) lcp: actual 2531 ms vs PRD budget 2500 ms; approved cap 2800 ms; owner @isaachan; severity medium; target 2026-08; justification: Museum route shows small CI lab variance around the PRD LCP target while remaining usable.
- car-detail (/cars/mclaren-mp4-4) lcp: actual 3752 ms vs PRD budget 2500 ms; approved cap 4200 ms; owner @isaachan; severity high; target 2026-08; justification: Car detail route remains functional but is currently over LCP budget with full content payload.
- technology-detail (/technologies/honda-ra168e) lcp: actual 2781 ms vs PRD budget 2500 ms; approved cap 3200 ms; owner @isaachan; severity high; target 2026-08; justification: Technology page has acceptable usability but exceeds LCP budget in CI simulation.

### Blocking exceptions

- None
