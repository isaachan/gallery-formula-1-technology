# US-H01 Accessibility Audit

- Date: 2026-07-11
- Standard: WCAG 2.2 AA
- Scope: `/`, `/seasons/1988`, `/museum`, `/cars/mclaren-mp4-4`, `/people/ayrton-senna`, `/technologies/honda-ra168e`

## Automated baseline

- `tests/unit/accessibility-routes.test.tsx` runs `axe-core` against the main route families in jsdom.
- Automated checks cover headings, landmarks, form labels, roles, link/button semantics, and common ARIA misuse.
- `color-contrast` is excluded from jsdom automation because it is not reliable without a browser layout engine; contrast remains part of the manual checklist below.

## Manual checklist

- Shared shell: landmarks, visible focus, 200% zoom/reflow, touch targets, color contrast, page titles.
- Timeline: keyboard traversal, decade chips, season links, preview open/close behavior, reduced motion, return-position behavior.
- Season detail: heading focus on navigation, adjacent-season controls, long race-list expansion, relationship links, audio controls/transcript, error fallback.
- Museum/search: tab order, search entry/result flow, no-result state, state preservation after return navigation.
- Subject pages: semantic fact sections, relationship chips, timeline return CTA, rich-media fallback text.
- Rich media: images/galleries/diagram/animation/audio/video/3D all keep captions or descriptions, fallback posters, and failure messaging.

## Current result

- Automated route-family baseline is expected to pass in CI.
- No approved accessibility exceptions are recorded for launch.
- Manual-only checks remain release-gate spot checks and should be re-run whenever a route template or shared control changes materially.
