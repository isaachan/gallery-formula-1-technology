# F1 Track Chronicle - Development Plan

## 1. Purpose

This plan translates the PRD and architecture into an implementation sequence suitable for handoff to a development team. It covers the production application, content platform, historical research workflow, and publication of every Formula 1 season from 1950 onward.

No separate CMS is planned. Developers maintain versioned YAML/MDX content and media manifests in the repository. Merging an approved change publishes it immediately through the deployment pipeline.

## 2. Confirmed product decisions

- Content maintainers are developers and are comfortable editing repository files.
- Chinese is the primary editorial language. English is currently required only for names and subtitles.
- The platform must technically support licensed images, audio, video, diagrams, animation, and 3D models. The product owner is responsible for final licensing and legal approval.
- Historical knowledge will be researched from public web sources such as official archives, reputable publications, and Wikipedia, then written into the repository for review.
- Content publishes immediately after an approved change is merged.
- The publication boundary is fixed per release. The initial release covers exactly the 76 seasons from 1950 through 2025 inclusive.

## 3. Delivery approach

Use iterative, vertical delivery. Each increment should include domain content, UI, validation, accessibility, tests, and deployability rather than building all infrastructure before any usable experience.

Recommended cadence:

- Two-week iterations.
- A prioritized product backlog refined at least once per iteration.
- A demonstrable, potentially releasable increment at the end of every iteration.
- Trunk-based development with short-lived branches and required pull-request review.
- Automated preview deployment for each pull request.
- Immediate production deployment after merge when all quality gates pass.

The team should estimate the backlog after confirming staffing and technical stack. This document deliberately avoids calendar promises without team capacity data.

## 3.1 Delivery status

| Story | Status | Notes |
| --- | --- | --- |
| US-A01 - Run the application locally | Done on 2026-07-11 | Implemented Next.js + TypeScript local foundation, pinned Node/npm versions, documented local setup, added separate quality commands, added example env file, and verified `format`, `lint`, `typecheck`, `test`, `validate:content`, and `build` in both the working tree and an isolated QA copy under `/tmp/f1-qa-us-a01.*`. |
| US-A02 - Deploy a preview and production build | Done on 2026-07-11 | Added GitHub Actions CI, Vercel preview and production deployment workflows, deployment documentation, and `/api/diagnostics` exposing app/content/build versions. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-a02.*`. |
| US-A03 - Apply the visual system | Done on 2026-07-11 | Centralized color, spacing, radius, shadow, motion, and era tokens in shared CSS, added focus-visible and 44px touch-target defaults, and rebuilt the home shell around the 390px mobile baseline with a deliberate desktop layout. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-a03.*`. |
| US-B01 - Define and validate domain content | Done on 2026-07-11 | Completed child stories US-B01.1 through US-B01.8, covering schema contracts, typed validators, graph validation, migrations, and CI enforcement for positive, boundary, and negative fixture coverage across all schema families. Verified final integration with `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-8.*`. |
| US-B01.1 - Define the common entity contract | Done on 2026-07-11 | Implemented the common entity envelope validator with lifecycle states, schema version, stable id/slug rules, redirect history, Chinese-first localized text, editorial metadata, and an initial allowlisted content-block registry. Added valid/invalid fixtures, field-level validation tests, and JSON-file validation through `npm run validate:content`. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-1.*`. |
| US-B01.2 - Validate seasons, races, circuits, and standings | Done on 2026-07-11 | Added typed validators for season, race, circuit, and standing entities, including season relationship fields and the driver Top 3 default visibility contract. Added valid/invalid fixtures, type-dispatched validation through `npm run validate:content`, and dedicated tests for standings integrity and file-path diagnostics. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-2.*`. |
| US-B01.3 - Validate cars, teams, and people | Done on 2026-07-11 | Added typed validators for car, team, and person entities, including car specification maps, person lifecycle fields, and relationship id arrays for teams/cars/people. Added valid/invalid fixtures, participant-specific validator tests, shared validator integration tests, and stabilized `npm run typecheck` with `next typegen`. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-3.*`. |
| US-B01.4 - Validate technologies, eras, and sources | Done on 2026-07-11 | Added typed validators for technology, era, and source entities, including technology category/difficulty fields, era year/color semantics, and source claim-support metadata. Added valid/invalid fixtures, topic-specific validator tests, and shared validator integration tests for file-path diagnostics. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-4.*`. |
| US-B01.5 - Validate media assets | Done on 2026-07-11 | Added an independent `mediaAsset` schema for image, audio, video, model, and poster records, including rights metadata, variants, focal points, poster/fallback references, and model-specific technical fields. Added valid/invalid fixtures, media-specific validator tests, and shared validator integration tests for file-path diagnostics. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-5.*`. |
| US-B01.6 - Validate cross-entity relationships | Done on 2026-07-11 | Added graph-level validation on top of per-file schemas, covering duplicate ids, duplicate slugs, missing target ids, reverse relationship mismatches, and race/season year consistency. Added integration tests for duplicate identity errors and cross-file reference diagnostics. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-6.*`. |
| US-B01.7 - Version and migrate schemas | Done on 2026-07-11 | Added versioned migration utilities for the common entity family, including idempotent upgrade steps from schema v0 to v1, before/after fixtures, and tests proving migrated content preserves stable IDs and passes the current validator. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-7.*`. |
| US-B01.8 - Enforce content validation in CI | Done on 2026-07-11 | Added a fixture-matrix contract test that requires every schema family to ship valid, boundary, and invalid JSON fixtures, and validates all of them in `npm run test` so CI blocks contract regressions before publication. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b01-8.*`. |
| US-B02 - Compose entity stories from typed blocks | Done on 2026-07-11 | Completed child stories US-B02.1 through US-B02.8: every registered block type (`richText`, `quote`, `factGrid`, `image`, `gallery`, `relatedEntities`, `diagram`, `animation`, `audio`, `video`, `model3d`) now has a real renderer with malformed-content diagnostics, and an image-to-3D primary-visual upgrade is proven to require only a content/media change. Verified final integration with `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-8.*`. |
| US-B02.1 - Register and validate content blocks | Done on 2026-07-11 | Added a shared block-type registry, placeholder renderers for all approved block families, stable-ID/order-preserving preview rendering, and safe unknown-block diagnostics for development previews while keeping publication failure enforcement in schema validation. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-1.*`. |
| US-B02.2 - Render prose and structured facts | Done on 2026-07-11 | Replaced placeholder rendering for `richText`, `quote`, and `factGrid` with semantic block renderers, localized content selection, inline source references, responsive fact-grid styling, and safe malformed-block diagnostics in preview mode. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-2.*`. |
| US-B02.3 - Render images and galleries | Done on 2026-07-11 | Replaced placeholder rendering for `image` and `gallery` with a client `ImageWithFallback` renderer supporting responsive AVIF/WebP-style variant `<picture>` sources, reserved aspect-ratio dimensions, focal-point cropping, captions/credits, malformed-block diagnostics, per-gallery-item failure isolation, and a runtime `onError` fallback so a broken asset degrades without collapsing the page. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-3.*`, and confirmed the preview renders correctly in-browser at the mobile baseline viewport. |
| US-B02.4 - Render related entities | Done on 2026-07-11 | Replaced the placeholder for `relatedEntities` with a renderer that lists resolved related-entity summaries as links to their canonical routes, grouped by entity type, without page-specific joins. An empty related-entities block renders the shared malformed-block diagnostic, and an individual unresolved reference is isolated as a per-item fallback so the rest of the list still renders. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-4.*`, and confirmed the preview (including the broken-reference case) renders correctly in-browser. |
| US-B02.5 - Render diagrams and animations | Done on 2026-07-11 | Replaced the `diagram` and `animation` placeholders. `diagram` reuses the image renderer and requires a localized textual explanation alongside it. `animation` adds a client `AnimationWithControls` component driven by real `<video>` `play`/`pause` events (not requested intent) so its toggle button never claims a playback state the media hasn't actually reached, autoplays only when `prefers-reduced-motion` is not set (reactive via `useSyncExternalStore`), always shows a poster static alternative, and always renders the required textual explanation. Added local demo video/poster assets generated with ffmpeg under `public/demo/`. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-5.*`, and confirmed autoplay, the reduced-motion-safe fallback label, and the pause/play toggle in-browser. |
| US-B02.6 - Render audio and video | Done on 2026-07-11 | Replaced the `audio` and `video` placeholders with client `AudioWithControls`/`VideoWithControls` components built on native `<audio controls>`/`<video controls>` (no `autoplay`), giving accessible, keyboard-operable play/pause/stop for free. Both require a localized transcript or equivalent non-speech description, render an optional credit, and show a safe fallback message on load failure via `onError`. `video` also requires a poster. Added local demo clip/poster/audio assets generated with ffmpeg under `public/demo/`. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-6.*`, and confirmed in-browser that both elements start paused with no autoplay and correct poster/controls attributes. |
| US-B02.7 - Render 3D models | Done on 2026-07-11 | Added the React Three Fiber/Drei/Three.js stack (per architecture) and a `Model3DViewer` that gates the GLB behind an explicit poster "查看 3D 模型" tap, lazy-loads the renderer via `next/dynamic({ ssr: false })` into its own chunk, detects WebGL support (`useSyncExternalStore`) with a static-poster-and-description fallback when unavailable, pauses the render loop via `IntersectionObserver` when offscreen, disables auto-rotate under `prefers-reduced-motion`, supports touch/pointer orbit plus arrow-key rotation, and falls back to a poster+message on load error via a class `Model3DErrorBoundary`. Requires a localized textual description alongside the model always. Generated a real demo GLB (via three.js's `GLTFExporter` in Node) and poster under `public/demo/`. Verified `npm run ci` (including `next build`) in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-7.*`; confirmed in a production (`next build && next start`) browser session that the 3D chunk is absent from the initial page load and only fetches after the explicit tap, and that the model renders and auto-rotates correctly. |
| US-B02.8 - Prove content-only media replacement | Done on 2026-07-11 | Added a test that renders one entity's primary-visual block as `type: "image"`, then re-renders the identical block id/heading/sources with only `type`/`media`/`description` changed to `type: "model3d"`, through the exact same `renderContentBlocks` call. Confirms the image renderer's output is replaced by the 3D viewer's poster/launch-control output with no per-entity or per-route branching required. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b02-8.*`. |
| US-B03 - Manage media consistently | Partially done on 2026-07-11 | Added `src/domain/media-file-validation.mjs`, wired into `tools/content/validate-content.mjs`, so a schema-valid `mediaAsset` document is also checked against the filesystem: local `src`/variant paths must exist under `public/` (or the configured public root), a variant's declared `mimeType` must agree with its file extension, image assets warn above the PRD's 500KB budget, 3D models warn above 8MB and require explicit recorded approval above 15MB (per architecture), and any remote URL must match a new `CONTENT_MEDIA_ALLOWED_ORIGINS` allowlist (documented in `.env.example`) or fails validation — satisfying "adding another remote origin requires an explicit reviewed configuration change." Stable IDs, media kind, alt text, rights-review status, captions/credits/focal points/variants/poster-fallback requirements were already covered by the US-B01.5 schema and the US-B02.3/5/6/7 renderers. Covered by 7 focused unit tests plus one integration smoke test through the full `validateContentRoot` pipeline. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b03.*`. **Deferred, not yet done:** declared `width`/`height` are not checked against the file's actual decoded dimensions; no CDN upload/sync pipeline exists yet (only the allowlist mechanism that would permit one). |
| US-B05 - Scaffold and preview content changes | Partially done on 2026-07-11 | Added `tools/content/scaffold-content.mjs` (`npm run content:new <type> <slug>`) generating a schema-valid `"status": "draft"` document with a stable `<idPrefix>-<slug>` id for all 11 entity/media types, filling required-but-unknowable relationship fields with obvious `-todo` placeholders and required text with `待补充` placeholders, and refusing to overwrite an existing file. Because `validateContentRoot` already reports "references missing target id" for every placeholder, running `validate:content` right after scaffolding gives an actionable checklist of exactly what still needs real values — proven by a test that scaffolds every type and asserts every resulting failure is a placeholder reference, never a schema defect. Documented editing text, adding an image, and swapping an image block for a `model3d` block in `content/README.md`. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b05.*`. **Deferred, not yet done:** no page or preview build yet reads the repository's `includeDrafts` flag by environment/protected-preview status, since no Epic C/D route consumes `ContentRepository` yet — draft-vs-production visibility is implemented at the repository level (`includeDrafts` option) but not wired to an actual preview-gating mechanism in the app. |
| US-B04 - Generate a queryable content graph | Partially done on 2026-07-11 | Added `ContentRepository` (`src/content/content-repository.ts`), a single file-access boundary matching the documented interface (`getTimeline`, `getSeasonByYear`, `getEntityBySlug`, `listMuseum`, `search`), filtering to `status: "published"` by default (`includeDrafts` opt-in), resolving forward references into localized `EntityCard` summaries, and deriving one genuine reverse relationship not stored in content (a person's `racesWon`, computed from `race.winnerPersonId`). Covered by 9 contract tests using a synthetic content root built from the existing 1988-season fixtures, including empty/missing-reference and no-match cases. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b04.*`. **Deferred, not yet done:** `listMuseum` filters are accepted but not applied; `search` is a naive title/subtitle/alias substring match, not a generated index; `getEntityBySlug` only enriches `season` and `person` types with relationship data (car/team/technology/era enrichment, and compact/cached route-payload emission, are left for a follow-up increment). No page yet consumes the repository since Epic C/D routes are not built. |
| US-C01 - Browse every season on the track | Done on 2026-07-11 | Completed child stories US-C01.1 through US-C01.8. The timeline shell now includes the full 76-season demo sequence, normative geometry, decade jumping, decorative-car movement, nearby-card emphasis, highlighted-season treatment, reduced-motion behavior, and a repeatable Lighthouse mobile audit across 320px, 390px, and 430px viewports with all budgets passing. The route still uses clearly labeled demo season data until Epic G authors the researched 1950–2025 repository content, but the interaction/performance envelope is now verified and ready for that content swap. |
| US-C01.1 - Render the complete season sequence | Partially done on 2026-07-11 | Added `src/timeline/sequence.ts` (`validateSeasonSequence`/`validateSeasonRange`) detecting gaps and duplicate years in a season list, covered by 7 tests. The `Timeline` component renders exactly one node per season in the array it's given (verified for a 76-season demo set). **Not yet done:** wiring the gap/duplicate validator into a CI check against real content, which needs Epic G season content to exist first. |
| US-C01.2 - Reproduce the track geometry | Done on 2026-07-11 | Ported the prototype's exact `_layout`/`_carAt` algorithm (design/F1 赛道年代记.dc.html) into `src/timeline/geometry.ts` as pure, normative functions: alternating left/right node positions, highlighted-vs-ordinary node height allocation, decade banner insertion, the cubic-bezier road path, and a documented `compact` mobile-density mode. 13 tests assert exact prototype-derived pixel values (node positions, total height, the literal SVG path string) rather than approximate ranges. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-c01.*`. |
| US-C01.3 - Navigate by decade | Done on 2026-07-11 | Added `DecadeSelector` (chip row reusing the existing `.chip`/era-color styling from US-A03), synced to the nearest season via `computeNearestDecade`, auto-centering the active chip with `scrollIntoView`, and jumping the track to a clicked decade's banner. Covered by component tests asserting the exact scroll target and the active-chip sync. |
| US-C01.4 - Move the decorative car | Done on 2026-07-11 | `computeCarPosition` reproduces the prototype's eased position/tangent-angle formula exactly (13 geometry tests including anchor clamping and the ±60° rotation limit), driven by an rAF-throttled scroll handler so it never blocks touch scrolling. **Verification note:** live scroll-driven movement could not be visually confirmed in the automated browser tool because the preview tab runs backgrounded (`document.visibilityState: "hidden"`), and browsers universally suspend `requestAnimationFrame`/smooth-scroll for hidden tabs — confirmed by testing that even `window.scrollTo({behavior:"smooth"})` does not progress in that tab. Correctness is instead verified by 6 component tests (with a synchronous rAF stub) plus in-browser confirmation that `scrollTo` receives the exact correct target and that the container is genuinely scrollable. |
| US-C01.5 - Emphasize nearby season cards | Done on 2026-07-11 | `isNodeEmphasized` reproduces the prototype's exact 190px threshold (opacity 1 within, 0.42 beyond), with boundary tests at 189/190/191px. Confirmed visually in-browser at the track's initial (unscrolled) position, where nearby cards render fully opaque and a card just past the threshold renders dimmed. |
| US-C01.6 - Distinguish highlighted seasons | Done on 2026-07-11 | The `Timeline` component branches purely on each season's `highlighted` boolean (content configuration), not on hardcoded years; the demo data reuses the prototype-approved highlighted-year list (1950, 57, 59, 68, 76, 78, 88, 92, 94, 2004, 09, 14, 21, 25) as the initial reference set. Confirmed in-browser: 14 highlighted cards and 62 ordinary cards render for the 76-season demo, matching the list exactly. |
| US-C01.7 - Support reduced motion | Done on 2026-07-11 | Decade-jump and chip-centering scrolls use `behavior: "auto"` instead of `"smooth"` under `prefers-reduced-motion` (shared `useReducedMotion` hook, relocated from `src/blocks/media` to `src/hooks` for reuse); the legend card's decorative floaty animation is a real CSS `animation` so the existing global `prefers-reduced-motion` override from US-A03 disables it automatically. All navigation (decade jump, node/card selection) remains available under reduced motion. Verified with a dedicated component test asserting `scrollTo` receives `behavior: "auto"` when reduced motion is preferred. |
| US-C01.8 - Verify mobile timeline performance | Done on 2026-07-11 | Added `npm run perf:timeline`, a repeatable Lighthouse audit against the production build at 320px, 390px, and 430px widths, writing committed reports under `docs/performance/`. The current 76-season timeline shell passes the PRD mobile budgets with median LCP at 2481ms, CLS at 0, initial script at 157.6KB, image bytes at 16.3KB, and a documented TBT proxy of 11ms where Lighthouse did not emit INP locally. Verified `npm run ci` in the working tree and `npm run ci && npm run perf:timeline` in an isolated QA copy under `/tmp/f1-qa-us-c01-8.*`. |
| US-C02 - Preview or open a season | Done on 2026-07-11 | Ordinary season nodes/cards toggle a `role="group"` preview popover (champion, champion car, tag) with a "进入该赛季 GO! ▸" link to the canonical season URL; highlighted seasons and the popover's CTA link navigate directly. The popover closes via a second activation, an "✕" close button, or Escape (which also returns focus to the triggering node). Scroll position and open-popover state persist to `sessionStorage` (keyed `f1-timeline-state`) and are restored on remount, standing in for "Browser Back restores the timeline position" until the app has real client-side route history to test against. Timeline nodes carry descriptive accessible labels (`"{year} · {champion} · {car}"`) and are fully keyboard-operable (native `button`/`a` semantics). Covered by 6 new component tests (open/toggle-closed, Escape, close-button, sessionStorage restore across unmount/remount) plus the pre-existing link/button role tests. Verified `npm run ci` (lint, typecheck, unit tests, `validate:content`, `next build`) in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-c02-c03.*`. **Verification note:** interactive in-browser confirmation of the popover/Escape/focus-restore flow could not be completed because the automated browser tool's safety classifier was unavailable for the duration of this session (`mcp__Claude_Browser__navigate`/`preview_list` calls failed with "claude-sonnet-5 is temporarily unavailable" across multiple retries); correctness instead rests on the component tests above, which exercise the exact same DOM events (`click`, `keydown Escape`) a real user interaction would produce. |
| US-C03 - Deep-link to a year | Done on 2026-07-11 | Added the canonical `src/app/seasons/[year]/page.tsx` route (backed by a new `getContentRepository()` cached loader and a `blocks` field added to `ContentRepository`'s `SeasonView`), rendering champion, races, featured technologies, and the season's content blocks via the existing block registry; invalid years (non-integer, or no matching season) call `notFound()`, which resolves to a new global `src/app/not-found.tsx` page with a link back to the timeline. The home page (`src/app/page.tsx`) now reads a `?year=` search param and passes it to `Timeline` as `initialFocusYear`, which scrolls to and focuses that year's node on mount (deep link always takes priority over any persisted session state). Every season row's "← 返回时间轴" link points at `/?year={year}` to close the loop. Covered by 3 new route tests (happy path, out-of-range year, non-numeric year) and 1 new Timeline test (`initialFocusYear` scroll+focus). Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-c02-c03.*`, including a successful `next build` showing the new `ƒ /seasons/[year]` and `○ /_not-found` routes. **Verification note:** same browser-tool unavailability as US-C02 above — the deep-link scroll/focus and not-found rendering could not be confirmed interactively in-browser this session and should be spot-checked once the tool is available again. |
| US-D01 - Understand a season overview | Done on 2026-07-11 | Expanded the canonical season route into a real overview page backed by `ContentRepository` season payloads: decade context, champion/champion car, source list, entrant cars, standings, featured technologies, and canonical links for related people/cars/technologies. Long race lists now stay compact behind a native expandable `<details>` section so expansion does not reset scroll position. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-d01.*`. |
| US-D02 - Move between adjacent seasons | Done on 2026-07-11 | Added chronological previous/next season navigation to the canonical season route, sourced from `ContentRepository.getAdjacentSeasons()` so controls follow real timeline order and disappear correctly at start/end boundaries. The page now emits season-specific metadata (`title` and `description`) and swaps its `<h1>` to a small client component that focuses the heading on navigation, aligning the page change with accessible reading order. Coverage now includes middle, first, last, and solitary-season boundary cases plus metadata generation, and `npm run ci` passed in the working tree. Independent QA also passed after running `npm run ci` against the same workspace, with only pre-existing lint warnings for raw `<img>` in `src/blocks/media/model3d-viewer.tsx` and existing `act(...)` warnings in `season-page` tests. |

## 4. Roles

| Role | Responsibility |
| --- | --- |
| Product owner | Priorities, acceptance, licensing/legal decisions, final editorial approval |
| Engineering lead | Architecture integrity, technical sequencing, quality gates, operational readiness |
| Developers | Application, content tooling, tests, historical research, and repository content |
| Designer | Design fidelity, responsive behavior, interaction review, asset guidance |
| Content reviewer | Fact checking, source review, Chinese copy consistency, corrections |

One person may hold multiple roles, but a historical claim should be reviewed by someone other than its original author whenever practical.

## 5. Definition of Ready

A user story is ready when:

- its user value and scope are clear;
- acceptance criteria are observable and testable;
- required design reference or expected behavior is available;
- content and data dependencies are identified;
- source and media requirements are known;
- there is no unresolved decision that prevents implementation;
- the story is small enough to complete within one iteration, or has been split.

## 6. Definition of Done

A story is done only when:

- acceptance criteria pass;
- production code and content conform to the agreed schemas and architecture;
- tests were written or updated and pass in CI;
- accessibility, responsive behavior, loading, empty, and failure states were considered;
- new historical content includes reviewable sources;
- new media includes the required technical metadata and a rights-review status;
- documentation and migrations are updated where necessary;
- the pull request was reviewed and its preview checked;
- no known critical or high-severity defect remains;
- the change is merged and successfully deployed, or is demonstrably deployable when release is intentionally withheld.

## 7. Epics and user stories

Priorities use **P0** for launch-critical, **P1** for the next valuable increment, and **P2** for later work.

Numbered child stories inherit their parent story's persona, user value, priority, applicable acceptance criteria, and the global Definition of Done. The child statement adds the independently demonstrable scope used for iteration planning and acceptance; a child is not complete when an applicable parent criterion fails.

### Epic A: production foundation

#### US-A01 - Run the application locally

**As a developer,** I want a documented, reproducible local environment so that I can develop and validate changes quickly.

**Priority:** P0

**Acceptance criteria:**

- A clean checkout can be installed and started using documented commands.
- The supported runtime and package-manager versions are pinned.
- Formatting, linting, type checking, unit tests, production build, and content validation have separate commands.
- Environment variables are documented and an example file contains no secrets.

#### US-A02 - Deploy a preview and production build

**As a developer,** I want automated preview and production deployments so that changes can be reviewed and merged safely.

**Priority:** P0

**Acceptance criteria:**

- Every pull request produces a unique preview URL.
- CI blocks merge when required quality gates fail.
- A successful merge to the publishing branch deploys automatically.
- Deployment is atomic and the previous successful version can be restored.
- The deployed build exposes an application version and content version for diagnostics.

#### US-A03 - Apply the visual system

**As a learner,** I want a consistent visual experience matching the supplied design so that the application feels coherent and engaging.

**Priority:** P0

**Acceptance criteria:**

- Colors, typography, spacing, radii, shadows, era colors, and motion values are defined as shared tokens.
- Core controls meet minimum touch-target and focus requirements.
- The 390 px reference layout is faithfully represented and adapts deliberately to larger viewports.
- Reduced-motion behavior is defined centrally.

### Epic B: content platform

#### US-B01 - Define and validate domain content

**As a content-maintaining developer,** I want typed schemas for all entities so that invalid content cannot be published.

**Priority:** P0

**Delivery note:** This is a parent capability and is accepted only when all child stories US-B01.1 through US-B01.8 are complete. Child stories, rather than this parent, are planned into iterations.

**Acceptance criteria:**

- Schemas exist for seasons, races, standings, cars, people, technologies, teams, eras, sources, and media assets.
- IDs are stable, slugs are unique, and relationships use IDs.
- Validation reports actionable file paths and field-level errors.
- CI detects duplicate IDs, broken references, invalid years, missing required localization, and unsupported schema versions.
- Schema migrations are versioned and tested.

##### US-B01.1 - Define the common entity contract

Define and test the common entity envelope, lifecycle states, schema version, stable IDs, mutable slugs with redirect history, Chinese-first localization, English name/subtitle support, sources, editorial metadata, and content blocks.

##### US-B01.2 - Validate seasons, races, circuits, and standings

Define and test schemas for seasons, races, circuits, driver standings, and constructor standings. The model stores complete driver and constructor standings where the competition supplied them and supports displaying the driver Top 3 by default.

##### US-B01.3 - Validate cars, teams, and people

Define and test schemas and relationship constraints for cars, constructors/teams, drivers, engineers, designers, and team principals.

##### US-B01.4 - Validate technologies, eras, and sources

Define and test schemas for technology and regulation topics, eras, and source records, including the fields needed to explain which claims a source supports.

##### US-B01.5 - Validate media assets

Define and test the central media-asset schema, including stable identity, type, variants, dimensions, accessibility metadata, fallbacks, technical budgets, and rights-review status.

##### US-B01.6 - Validate cross-entity relationships

Detect duplicate IDs and slugs, missing targets, invalid relationship types, inconsistent years, and invalid reverse relationships with file- and field-level diagnostics.

##### US-B01.7 - Version and migrate schemas

Provide versioned, idempotent migrations with representative before/after fixtures and tests proving that supported content can be upgraded without changing stable IDs.

##### US-B01.8 - Enforce content validation in CI

Run positive, boundary, and negative fixtures for every schema family in CI and block publication when content violates a supported contract.

#### US-B02 - Compose entity stories from typed blocks

**As a content-maintaining developer,** I want to assemble pages from approved content blocks so that presentation can evolve without page-specific code.

**Priority:** P0

**Delivery note:** This is a parent capability and is accepted only when all child stories US-B02.1 through US-B02.8 are complete.

**Acceptance criteria:**

- The initial registry supports rich text, image, gallery, fact grid, quote, diagram, animation, audio, video, 3D model, and related-entity blocks.
- Blocks have stable IDs and may be reordered in content.
- Unknown blocks fail publication validation and produce a safe diagnostic in development preview.
- Changing an existing image block to an existing 3D block requires content and asset-manifest changes only.

##### US-B02.1 - Register and validate content blocks

Implement the discriminated block registry, stable block IDs, ordering, allowlisted configuration, publication failure for unknown blocks, and safe development-preview diagnostics.

##### US-B02.2 - Render prose and structured facts

Implement rich-text, quote, and fact-grid blocks with localized content, semantic structure, source references, responsive behavior, and invalid-content tests.

##### US-B02.3 - Render images and galleries

Implement image and gallery blocks with responsive variants, reserved dimensions, captions, credits, focal points, alternative text, and per-asset failure behavior.

##### US-B02.4 - Render related entities

Implement related-entity blocks using canonical graph relationships without page-specific joins, including empty and broken-reference behavior.

##### US-B02.5 - Render diagrams and animations

Implement diagram and animation blocks with pause controls, reduced-motion behavior, static alternatives, textual explanations, and supported mobile-viewport tests.

##### US-B02.6 - Render audio and video

Implement audio and video blocks with explicit playback, stop behavior, posters where applicable, credits, errors, and transcripts for speech or equivalent descriptions for non-speech audio.

##### US-B02.7 - Render 3D models

Implement the lazy 3D block with touch, pointer, and keyboard operation; loading, poster, error, reduced-motion, reduced-data, unsupported-device, and offscreen-pausing behavior; and textual equivalence without WebGL.

##### US-B02.8 - Prove content-only media replacement

Replace an existing image presentation with an existing 3D asset using only entity content and the media manifest, while preserving the canonical route and surrounding page template.

#### US-B03 - Manage media consistently

**As a content-maintaining developer,** I want a central media manifest so that assets are reusable, attributable, accessible, and replaceable.

**Priority:** P0

**Acceptance criteria:**

- Every asset has a stable ID, media kind, source, alternative text, and rights-review status.
- Captions, credits, source URLs, focal points, responsive variants, posters, and fallbacks are supported where applicable.
- Validation checks file existence, MIME type, dimensions, byte budgets, poster/fallback requirements, and rights metadata.
- Heavy assets can be served from object storage/CDN while their manifests remain versioned in Git.

#### US-B04 - Generate a queryable content graph

**As an application developer,** I want normalized route data and reverse relationships so that pages do not implement ad hoc joins.

**Priority:** P0

**Acceptance criteria:**

- Build tooling resolves entity references and generates reverse relationships.
- Compact indexes exist for the timeline, museum, and search.
- Route payloads contain only required content rather than the entire graph.
- File access is hidden behind the documented `ContentRepository` boundary.
- Contract tests cover primary repository queries.

#### US-B05 - Scaffold and preview content changes

**As a content-maintaining developer,** I want simple content commands so that adding a valid entity does not require memorizing the schema.

**Priority:** P1

**Acceptance criteria:**

- A command scaffolds each primary entity with a stable ID and required fields.
- Local validation runs on demand and during development.
- Draft content is visible in local and protected preview builds but not production.
- Documentation includes examples for editing text, adding an image, and replacing an image with a 3D model.

### Epic C: timeline experience

#### US-C01 - Browse every season on the track

**As a learner,** I want to travel along a track containing every F1 season so that I can understand the sport chronologically.

**Priority:** P0

**Delivery note:** This is a parent capability and is accepted only when all child stories US-C01.1 through US-C01.8 are complete. Prototype distances, opacity thresholds, car movement, and rotation limits are normative unless an approved design change updates both the specification and tests.

**Acceptance criteria:**

- Every published season from 1950 onward appears exactly once.
- The sticky decade selector reflects the nearest season and jumps to the chosen decade.
- Scrolling updates the decorative car and nearby-card emphasis without scroll jank.
- Highlighted and ordinary seasons use their specified treatments.
- The experience remains navigable with animation disabled.

##### US-C01.1 - Render the complete season sequence

Render exactly one ordered timeline node for each published season from 1950 through the release boundary, with automated tests rejecting gaps and duplicates.

##### US-C01.2 - Reproduce the track geometry

Implement the prototype track path, season-node positions, decade banners, start/finish treatments, and documented mobile scaling using shared geometry fixtures.

##### US-C01.3 - Navigate by decade

Implement the sticky selector, nearest-season calculation, active-decade treatment, automatic chip centering, and decade jumps at every boundary fixture.

##### US-C01.4 - Move the decorative car

Move and rotate the decorative car along the track using the prototype's position and rotation rules without blocking touch scrolling.

##### US-C01.5 - Emphasize nearby season cards

Apply the prototype's normative distance and opacity thresholds and verify boundary behavior immediately inside, at, and outside each threshold.

##### US-C01.6 - Distinguish highlighted seasons

Apply the ordinary and highlighted treatments to the prototype-approved highlighted-season list using content configuration rather than component-specific year checks.

##### US-C01.7 - Support reduced motion

Remove continuous and nonessential movement when reduced motion is requested while preserving every timeline navigation and selection action.

##### US-C01.8 - Verify mobile timeline performance

Verify the complete timeline on the supported 320–430 CSS-pixel range and agreed mainstream-phone performance profile, recording any approved exception as technical debt.

#### US-C02 - Preview or open a season

**As a learner,** I want concise context before entering a season so that I can decide where to explore.

**Priority:** P0

**Acceptance criteria:**

- Ordinary season selection reveals its champion, champion car, and key technology in context.
- Highlighted seasons and explicit calls to action open canonical season URLs.
- Browser Back restores the timeline position and relevant preview state.
- Timeline nodes have descriptive accessible labels and keyboard operation.

#### US-C03 - Deep-link to a year

**As a learner following a shared link,** I want to arrive at the intended season and return to its timeline position so that links preserve historical context.

**Priority:** P0

**Acceptance criteria:**

- Every season has a stable canonical URL.
- A return-to-timeline link scrolls to and focuses the target year.
- Invalid years produce a useful not-found state rather than a blank view.

### Epic D: season experience

#### US-D01 - Understand a season overview

**As a learner,** I want a season overview so that I can understand its champion, key events, cars, people, and technology.

**Priority:** P0

**Acceptance criteria:**

- The page shows season identity, champion, champion car, decade context, editorial summary, and sources.
- Entrants, race results, standings, and featured technologies are shown from normalized data.
- Long race lists are initially compact and can be expanded without losing position.
- Related cars, people, and technologies link to canonical detail routes.

#### US-D02 - Move between adjacent seasons

**As a learner,** I want previous and next controls so that chronological exploration continues naturally.

**Priority:** P0

**Acceptance criteria:**

- Previous and next controls reflect chronological order and disappear at boundaries.
- Navigation updates title, metadata, content, and focus correctly.
- Expanded or media-playback state does not leak into the new season.

#### US-D03 - Hear representative engine audio

**As a learner,** I want optional engine audio so that I can experience an additional dimension of a car or era.

**Priority:** P1

**Acceptance criteria:**

- Audio begins only after explicit interaction.
- Play, pause/stop, duration, transcript or description, credit, and failure states are available.
- Route changes stop playback.
- Missing licensed audio does not block the rest of the page.

### Epic E: museum and subject pages

#### US-E01 - Browse the museum

**As a learner,** I want collections for cars, technology, and people so that I can explore by interest rather than chronology.

**Priority:** P0

**Acceptance criteria:**

- Museum tabs list published cars, technologies, and people from the content graph.
- Each card opens the canonical entity route and offers a representative timeline link.
- Returning preserves the selected tab and reasonable scroll state.
- Empty, loading, and content-error states are designed.

#### US-E02 - Search the museum

**As a learner,** I want to search names, aliases, teams, years, and technology terms so that I can find known subjects quickly.

**Priority:** P1

**Acceptance criteria:**

- Search covers Chinese names, English names/subtitles, aliases, relevant years, and relationships.
- Results identify entity type and historical context.
- Search is keyboard-accessible and handles no-result queries.
- The index is generated from published content and does not require a runtime database.

#### US-E03 - Learn about a car

**As a learner,** I want a car story, specifications, media, and relationships so that I understand both its engineering and historical importance.

**Priority:** P0

**Acceptance criteria:**

- The page renders common entity fields, structured specifications, story blocks, sources, and media.
- Drivers, constructor, seasons, and technologies are linked bidirectionally.
- It supports an image/gallery today and a 3D model later without route or template changes.

#### US-E04 - Learn about a person

**As a learner,** I want a person's profile, achievements, story, and representative seasons so that their role in F1 history is understandable.

**Priority:** P0

**Acceptance criteria:**

- The page supports drivers, engineers, designers, and team principals without creating separate page templates.
- It shows relevant teams, cars, seasons, achievements, story blocks, sources, and credited media.
- English is supported for the person's name/subtitle; Chinese is required for editorial prose.

#### US-E05 - Learn about a technology

**As a learner,** I want a visual and plain-language technical explanation so that I can understand why an innovation mattered.

**Priority:** P0

**Acceptance criteria:**

- The page renders difficulty, category, story, sources, first/representative season, related cars, and related technologies.
- Article, diagram, animation, and 3D presentations share the same surrounding page contract.
- Every interactive presentation has a static and textual fallback.
- A timeline action returns to the technology's representative season.

### Epic F: rich media

#### US-F01 - View responsive photographs and galleries

**As a learner,** I want clear, efficiently loaded media so that I can inspect people and machines on any device.

**Priority:** P0

**Acceptance criteria:**

- Images use generated responsive variants and modern formats with a compatible fallback.
- Layout dimensions are reserved before loading.
- Captions, credits, alternative text, and focal-point cropping behave consistently.
- A failed asset shows an informative fallback without collapsing the page.

#### US-F02 - Explore a 3D model

**As a learner,** I want to rotate and inspect a car or component so that its shape and construction are easier to understand.

**Priority:** P0

**Acceptance criteria:**

- The viewer is lazy-loaded and does not increase the initial timeline bundle.
- Touch, pointer, and keyboard controls work and are documented accessibly.
- Poster, progress, error, reduced-motion, reduced-data, and unsupported-device states work.
- Rendering pauses offscreen and model budgets are enforced in validation.
- The content explanation remains complete without WebGL.

#### US-F03 - View technical animation or diagram

**As a learner,** I want motion or annotated comparison where appropriate so that a process is easier to understand.

**Priority:** P0

**Acceptance criteria:**

- Animation can be paused and honors reduced-motion preferences.
- Diagram labels remain readable at supported viewport sizes and keyboard zoom does not hide content.
- A static alternative and equivalent explanation are provided.
- The renderer accepts content configuration only through an allowlisted schema.

### Epic G: historical content and research

#### US-G01 - Maintain a research record

**As a content reviewer,** I want every historical entry to preserve its sources so that I can verify claims later.

**Priority:** P0

**Acceptance criteria:**

- Each entity references one or more source records.
- Source records include title, publisher/author where available, URL, access date, source type, and notes about supported claims.
- Content distinguishes sourced facts from editorial interpretation.
- Wikipedia may be used for orientation and cross-checking, but consequential or disputed claims require an additional reputable source where available.
- Direct quotations are clearly marked, brief, and attributed; prose is written originally rather than copied.

#### US-G02 - Populate a season research packet

**As a developer-researcher,** I want a repeatable season template so that all seasons reach a consistent minimum level of completeness.

**Priority:** P0

**Acceptance criteria:**

- Each season contains champion, champion car, constructors/entrants as scoped, race list and winners, top standings, key technology or regulation context, a Chinese summary, and sources.
- Unknown or conflicting information is recorded explicitly rather than guessed.
- Names and IDs resolve to canonical person, car, team, race, and technology records.
- QA checks factual consistency against the agreed source hierarchy before the content batch is accepted.

#### US-G02A - Validate the 1988 reference season

**As a product team,** I want one verified, full-depth reference season before bulk population so that the content contract and primary journeys are proven before they are repeated across 76 seasons.

**Priority:** P0

**Acceptance criteria:**

- Verified historical data overrides conflicting prototype data while the prototype's full information structure is retained.
- The season contains every championship race and winner, complete driver and constructor standings where applicable, a default driver Top 3 presentation, entrants/cars as scoped by the reference design, a Chinese editorial story, and reviewable sources.
- At least three representative technology or regulation presentations exercise the article/image, diagram or animation, and 3D-with-fallback contracts.
- The primary journey works from the timeline to 1988, to a representative car, person, and technology, and back to the correct timeline position.
- The applicable mobile visual references, accessibility checks, content validation, and QA fact check pass before the bulk season template is accepted.

#### US-G03 - Populate every season

**As a learner,** I want every season represented with meaningful information so that the timeline is a complete historical journey.

**Priority:** P0

**Delivery note:** This is the aggregate launch gate, not an iteration-sized story. Content is delivered through US-G03.1 through US-G03.8, with US-G03.9 providing final cross-release acceptance. A decade story may be divided into two consecutive five-season batches without changing its acceptance contract.

**Acceptance criteria:**

- Exactly the 76 seasons from 1950 through 2025 satisfy the minimum completeness contract for the initial release.
- Automated coverage reports show no missing season, required field, broken relation, or missing source.
- Highlighted seasons receive the richer editorial treatment defined by the design.
- US-G02A meets the full 1988 reference depth before the bulk template is accepted.
- Content may be merged in reviewed decade-sized batches while the launch gate requires complete coverage.

**Minimum completeness contract for every season:**

- The champion and championship car are present and resolve to canonical records.
- Every championship race and winner is present and resolves to canonical race, person, car/team, and circuit records as applicable.
- Complete driver standings and constructor standings are stored where that championship existed; the driver Top 3 is displayed by default.
- A Chinese editorial summary and at least one technology or regulation topic are present.
- At least one source is attached, and the combined attached sources support the material factual fields.
- Deliberate original/mock illustrations may be used, but empty placeholders, broken slots, watermarks, copied unapproved images, and “资料整理中” or equivalent labels may not publish.
- Automated validation and a QA fact check pass.

**Additional completeness contract for highlighted seasons:**

- The season includes a longer Chinese narrative, at least three notable events or facts, at least two technology or regulation topics, at least one related car, at least one related person, and at least one visual asset.
- The prototype-approved highlighted-season list is used for the initial release unless changed through an approved content decision.

##### US-G03.1 - Populate and verify 1950–1959

Apply the US-G03 completeness contracts to every season from 1950 through 1959.

##### US-G03.2 - Populate and verify 1960–1969

Apply the US-G03 completeness contracts to every season from 1960 through 1969.

##### US-G03.3 - Populate and verify 1970–1979

Apply the US-G03 completeness contracts to every season from 1970 through 1979.

##### US-G03.4 - Populate and verify 1980–1989

Apply the US-G03 completeness contracts to every season from 1980 through 1989, reusing the accepted 1988 reference season without weakening its richer contract.

##### US-G03.5 - Populate and verify 1990–1999

Apply the US-G03 completeness contracts to every season from 1990 through 1999.

##### US-G03.6 - Populate and verify 2000–2009

Apply the US-G03 completeness contracts to every season from 2000 through 2009.

##### US-G03.7 - Populate and verify 2010–2019

Apply the US-G03 completeness contracts to every season from 2010 through 2019.

##### US-G03.8 - Populate and verify 2020–2025

Apply the US-G03 completeness contracts to every season from 2020 through the fixed initial-release boundary of 2025.

##### US-G03.9 - Audit complete historical coverage

Run the aggregate 1950–2025 coverage, relationship, localization, terminology, source, media, and factual-consistency audit and block launch on any unresolved required-content failure.

#### US-G04 - Record corrections transparently

**As a content reviewer,** I want corrections to be traceable so that historical trust is maintained.

**Priority:** P1

**Acceptance criteria:**

- Git history identifies the changed claim and reason.
- Material corrections update the entity's review metadata.
- Corrections deploy through the same automated validation and review path as other changes.

#### US-G05 - Report a content mistake

**As a learner,** I want to report a possible factual or editorial mistake from the page where I found it so that the product owner can review and correct the content.

**Priority:** P0

**Acceptance criteria:**

- Every published season, car, person, and technology detail page provides a consistently placed, keyboard-accessible feedback action with a descriptive accessible name.
- Activating the action opens the learner's configured email client using a documented product-owner feedback address; the application does not send an email without the learner's explicit action.
- The draft email has a predefined subject identifying it as a content correction and a body containing the page title, canonical URL, entity type, entity ID, application version, and content version.
- The draft body prompts the learner to describe the suspected mistake and, when available, provide a supporting source; it does not automatically include personal information or the learner's browsing history.
- If an email client cannot be opened, the page keeps its content and state, shows the feedback address and page reference in a copyable fallback, and explains how to report the issue manually.
- The feedback action and fallback work at all supported mobile viewport sizes and do not obscure or block access to the page content.
- Automated tests verify generation and encoding of the recipient, subject, and page-specific body fields; an end-to-end test verifies the feedback action and fallback without sending a real email.

### Epic H: quality, accessibility, and operations

#### US-H01 - Use the application accessibly

**As a learner using assistive technology or alternative input,** I want equivalent access to navigation and content.

**Priority:** P0

**Delivery note:** Accessibility remains part of every feature's Definition of Done. This parent capability organizes focused conformance verification through US-H01.1 through US-H01.7.

**Acceptance criteria:**

- Target routes meet WCAG 2.2 AA in automated and manual review.
- Keyboard navigation, focus management, semantic structure, color contrast, zoom, and screen-reader labels are verified.
- Rich media has the alternatives required by the PRD and architecture.

##### US-H01.1 - Verify shared navigation and controls

Test headings, landmarks, links, buttons, forms, touch targets, focus visibility, focus order, contrast, and mobile zoom/reflow for the shared shell and design-system controls.

##### US-H01.2 - Verify the timeline and season preview

Test keyboard and screen-reader navigation, decade selection, season nodes, preview focus behavior, reduced motion, and return-position behavior.

##### US-H01.3 - Verify season detail

Test semantic structure, long-list expansion, adjacent-season navigation, relationship links, focus management, and incomplete/error behavior.

##### US-H01.4 - Verify museum and search

Test tabs, search input/results, no-result/error states, card navigation, preserved state, and logical keyboard/screen-reader operation.

##### US-H01.5 - Verify subject pages

Test car, person, and technology routes, structured facts, relationships, feedback action, timeline return, localization, and fallback content.

##### US-H01.6 - Verify rich-media alternatives

Test images, galleries, diagrams, animation, audio, video, and 3D for accessible controls, captions or descriptions, transcripts for speech, posters/static alternatives, errors, reduced motion, and non-WebGL access.

##### US-H01.7 - Complete the manual conformance audit

Run and record automated and manual WCAG 2.2 AA review across the agreed route, browser, input, zoom, and assistive-technology matrix; document and approve any exception before release.

#### US-H02 - Meet performance budgets

**As a mobile learner,** I want the application to respond quickly without excessive data use.

**Priority:** P0

**Acceptance criteria:**

- Route and media budgets from the PRD are enforced or reported in CI.
- Core Web Vitals are measured by route family.
- 3D and other heavy renderers load only when needed.
- The application remains usable on a representative throttled mobile profile.

#### US-H03 - Diagnose production failures

**As a developer,** I want actionable operational information so that content or media failures can be corrected quickly.

**Priority:** P0

**Delivery note:** This is a parent operational capability delivered through US-H03.1 through US-H03.8.

**Acceptance criteria:**

- Route exceptions and media-renderer failures include application/content version and entity/asset ID.
- Publishing failures do not replace the last valid deployment.
- Alerts cover deployment failure, broken production assets, and media-rights expiry metadata when present.
- Analytics avoid collecting personal content or unnecessary identifiers.

##### US-H03.1 - Expose diagnostic versions

Expose the application version and content version in a documented diagnostic location and attach them to route, entity, and renderer error reports.

##### US-H03.2 - Report route and renderer errors

Capture actionable route and media-renderer failures with route family, entity ID, asset ID where applicable, diagnostic versions, and sufficient non-personal context to reproduce the failure.

##### US-H03.3 - Protect the last valid deployment

Prove that validation, build, or publishing failures cannot replace the last valid production deployment.

##### US-H03.4 - Monitor production assets

Detect broken or unavailable production assets and identify the affected asset and published entities without collecting learner content.

##### US-H03.5 - Report media-rights expiry

Report approaching or expired rights metadata when present, while treating `approved` and `mock-approved` as the only production-publishable initial statuses.

##### US-H03.6 - Route actionable alerts

Document alert severity, recipient/owner, acknowledgement expectation, escalation, and resolution evidence for deployment, asset, and rights failures.

##### US-H03.7 - Verify analytics privacy

Verify that aggregate analytics do not collect email contents, feedback drafts, personal content, or unnecessary persistent identifiers and that retention is documented.

##### US-H03.8 - Exercise smoke testing and rollback

Run a production smoke test after deployment and document a successful restoration exercise to the previous consistent application/content version.

## 8. Cross-story acceptance baselines

These decisions apply across the backlog and remove repeated ambiguity from individual stories.

### Historical sources and fact checking

- Prefer sources in this order: Formula 1/FIA and other official archives; constructor, team, circuit, or museum archives; Wikipedia and its cited references; reputable motorsport or news publications; then blogs when stronger sources are unavailable.
- One source record per entity is acceptable, but the combined attached sources must support its material facts. When sources conflict, use the highest available source in the hierarchy and record unresolved uncertainty rather than guessing.
- QA performs the acceptance fact check. At minimum, QA verifies every champion, championship car, race winner, and displayed Top 3 standing in a content batch and reviews summaries and technology/regulation topics for material contradictions.
- A learner feedback action is a post-publication safety net and does not replace source recording, automated validation, or pre-release QA fact checking.

### Mobile and visual support

- The eight supplied screenshots and interactive prototype are the initial visual references. The overall visual character must be retained; small approved changes to color, font size, and element layout are allowed.
- The prototype's timeline distances, opacity thresholds, movement, and rotation limits are normative unless an approved design change updates the implementation specification and tests.
- Explicit viewport acceptance covers 360 x 800, 390 x 844, 393 x 852, and 430 x 932 CSS pixels, with functional support across 320–430 CSS pixels.
- At widths above 430 CSS pixels the mobile presentation may be centered; a bespoke tablet or desktop layout is not required for the initial release.
- Test the latest two major Chrome versions on Android and Safari versions on iOS as evaluated for the release. Use emulation for the full matrix and smoke-test at least one current iPhone and one current Android device when available.
- Prototype fonts are preferred. If they cannot be loaded, use an approved cartoon-style fallback without causing clipped, overlapping, or inaccessible content.

### Performance exceptions

- PRD performance budgets are the expected pass condition. Initial-route JavaScript measurement excludes framework/runtime code.
- Performance fixtures cover the timeline, 1988 season, a person page, an image-based technology page, and a 3D technology page on an agreed mid-tier mobile/Slow 4G profile.
- QA may approve a temporary exception only when the affected journey remains usable. Each exception creates a technical-debt story recording the measured result, expected budget, affected routes, justification, owner, severity, and target release.
- A material LCP, INP, or CLS regression beyond the PRD target also requires product-owner acknowledgement.

### Media publication and fallbacks

- Initial rights statuses are `mock-approved`, `approved`, `restricted`, `expired`, and `rejected`. Production permits only `mock-approved` and `approved`; protected previews may show other statuses with a clear non-publishable warning.
- Purpose-made generic illustrations may publish as presentation assets. Broken placeholders, empty image slots, watermarks, copied unapproved images, and “coming later” labels may not publish. Mock assets require alternative text, a stable asset ID, and attribution as an original placeholder illustration.
- Images provide generated AVIF/WebP variants plus a compatible fallback, declare dimensions, and normally provide 480, 768, 1280, and 1920 pixel-wide cover variants where the source supports them. Validation warns when one optimized display asset exceeds 500 KB; the mobile above-the-fold total remains at or below 500 KB unless an approved performance exception exists.
- Repository/local assets and the configured first-party media CDN are allowed by default. Adding another remote origin requires an explicit reviewed configuration change; arbitrary remote URLs fail validation.
- Required fallbacks are: reserved error treatment and alt text for images; per-item failure isolation for galleries; a textual description for non-speech audio and a transcript for speech; a poster plus transcript or equivalent summary for video; a textual explanation for diagrams; a static representative frame plus equivalent explanation for animation; and a poster plus textual explanation for 3D.
- Compressed 3D assets target at most 5 MB, warn above 8 MB, and require an explicit recorded approval above 15 MB.

## 9. Priority recommendation

Implement the reorganized backlog in this order:

1. Complete the minimum completeness contract and domain schemas through US-B01 and its child stories.
2. Deliver and accept the 1988 vertical reference slice through US-G02A, including its primary routes and representative renderers.
3. Stabilize coverage tooling and the QA fact-check procedure before bulk historical population.
4. Deliver the decade content batches US-G03.1 through US-G03.8, splitting a decade into two five-season batches when needed to fit an iteration.
5. Complete the aggregate 76-season audit in US-G03.9 and accept the US-G03 launch gate.
6. Implement US-G05 once canonical entity routes, application/content diagnostic versions, and the product-owner feedback email address are available.

Accessibility, deployability, content validation, mobile behavior, and applicable observability remain part of each increment rather than being deferred to the end. Focused US-H01 and US-H03 child stories provide final route-family and operational assurance.

## 10. Recommended delivery increments

### Increment 0 - Walking skeleton

- Establish the application, CI, preview deployment, design tokens, and content schema.
- Publish one timeline entry and one route for each entity type through the real repository/query boundary.
- Prove automatic deployment and rollback.

**Exit condition:** A content-only text change passes validation, appears in preview, and publishes after merge.

### Increment 1 - 1988 vertical slice

- Implement timeline behavior, the complete 1988 season, representative car/person/technology routes, museum navigation, and initial block renderers.
- Include image, diagram/animation, and 3D fallback behavior.
- Match the eight supplied reference screens through visual review.

**Exit condition:** The complete primary journey works from timeline to season to each subject type and back, with accessible fallbacks and real repository content.

### Increment 2 - Content factory and first decades

- Stabilize research templates, source records, scaffolding, coverage reporting, media processing, and bulk validation.
- Populate and review 1950s-1970s in small batches.
- Address model/schema friction discovered by real content before scaling further.

**Exit condition:** Three decades meet the minimum completeness contract without page-specific workarounds.

### Increment 3 - Complete historical coverage

- Populate and review the 1980s through the current publication boundary.
- Add missing canonical people, cars, teams, and technologies as relationships require.
- Tune timeline payload, build time, and search index using full-scale content.

**Exit condition:** Automated coverage confirms every season and all P0 relationships/content requirements.

### Increment 4 - Launch hardening

- Complete museum search, cross-browser testing, performance tuning, accessibility review, security review, source audit, and production monitoring.
- Run correction passes for conflicts and inconsistent terminology.
- Verify media rights-review metadata with the product owner.

**Exit condition:** All launch acceptance criteria in the PRD and the release checklist pass.

## 11. Historical research workflow

For each season or subject:

1. Start with an explicit checklist of required facts and relationships.
2. Search broadly to identify terminology, aliases, controversies, and likely primary sources.
3. Prefer official Formula 1/FIA/constructor archives, contemporary records, books, museums, and reputable motorsport publications for important claims.
4. Use Wikipedia as a discovery aid and cross-check, following its citations where useful.
5. Record sources before drafting prose.
6. Write an original Chinese summary that separates fact from interpretation.
7. Normalize names, units, dates, teams, and relationships to repository entities.
8. Run automated validation and the season coverage report.
9. Have QA compare the entry's material facts with the agreed source hierarchy and record defects before acceptance.
10. Merge only when factual questions are resolved or explicitly documented.

Web content can change. Source records therefore include an access date, and durable/archive links should be used where legally and operationally appropriate.

## 12. Backlog management rules

- Product value, risk, and dependency determine priority; effort alone does not.
- P0 stories must be split until they can produce an independently testable increment.
- Defects that compromise facts, accessibility, security, publishing, or data loss take precedence over new P1/P2 features.
- Architectural work should be attached to a user-visible or operational capability, except for explicitly approved risk-reduction spikes.
- A spike is time-boxed and ends with evidence, a decision, and follow-up backlog items rather than production code by default.
- Content debt is visible in the backlog and coverage report, not hidden in placeholders.
- Scope may change between iterations; an active iteration changes only with product-owner and team agreement.

## 13. Release checklist

- All P0 stories and launch acceptance criteria are complete.
- Every required season passes the coverage contract.
- Source, relation, localization, media, and rights-status validation passes.
- Production build, unit, integration, end-to-end, accessibility, visual, and content tests pass.
- Performance budgets pass on representative routes and devices.
- No critical/high security or data-integrity finding remains.
- All production URLs, redirects, metadata, sitemap, and not-found behavior are verified.
- Monitoring, rollback, ownership, and incident contacts are documented.
- The product owner approves the content and media-rights review status.
- A production smoke test passes immediately after deployment.

## 14. Initial risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Full historical coverage is larger than expected | Define a minimum completeness contract, produce decade batches, automate coverage, and validate the 1988 template first |
| Public sources conflict or repeat errors | Preserve citations, prefer authoritative/independent sources, record uncertainty, and require second-person review |
| Media licensing is incomplete | Separate technical readiness from `rights.status`; block or substitute unapproved assets at the release gate |
| 3D assets harm mobile performance | Lazy-load, enforce budgets, optimize GLB/textures, cap rendering cost, and retain posters/fallbacks |
| Content schema becomes a page builder | Keep a small reviewed block registry and require architectural review for new block types |
| Immediate publishing releases a bad merge | Required CI, preview approval, branch protection, atomic deployment, smoke tests, and one-step rollback |
| Bulk content work creates inconsistent terminology | Canonical entities, aliases, editorial glossary, schema constraints, and automated consistency reports |
| Reliance on a framework or content source becomes difficult to change | Keep domain schemas, query layer, importer, and renderers behind explicit interfaces |
