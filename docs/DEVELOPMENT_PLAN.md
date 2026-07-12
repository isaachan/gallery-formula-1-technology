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
| US-B03 - Manage media consistently | Done on 2026-07-11 | `src/domain/media-file-validation.mjs`, wired into `tools/content/validate-content.mjs`, now checks local media existence, declared MIME types, declared dimensions for supported local image formats (`jpeg`, `png`, `webp`, `svg`), byte budgets, poster/fallback requirements, and remote-origin allowlisting through `CONTENT_MEDIA_ALLOWED_ORIGINS`. This closes the final missing validation gap for reusable media manifests while preserving the existing ability to point a manifest at object storage/CDN URLs instead of repository-local files. Covered by 8 focused unit tests plus the full content-validation pipeline. Verified `npm run ci` in the working tree. |
| US-B05 - Scaffold and preview content changes | Done on 2026-07-11 | Added `tools/content/scaffold-content.mjs` (`npm run content:new <type> <slug>`) generating a schema-valid `"status": "draft"` document with a stable `<idPrefix>-<slug>` id for all 11 entity/media types, filling required-but-unknowable relationship fields with obvious `-todo` placeholders and required text with `待补充` placeholders, and refusing to overwrite an existing file. The application now also honors preview draft visibility at runtime: `src/content/get-repository.ts` enables `includeDrafts` automatically for `VERCEL_ENV=preview` or `CONTENT_INCLUDE_DRAFTS=true`, documented in `.env.example` and `docs/DEPLOYMENT.md`, so protected previews can show draft content while production remains published-only. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-b05.*`. |
| US-B04 - Generate a queryable content graph | Done on 2026-07-11 | `ContentRepository` (`src/content/content-repository.ts`) now powers the real app routes, not just fixtures: `getTimeline`, `getSeasonByYear`, `getAdjacentSeasons`, `getEntityBySlug`, `listMuseum`, and `search` back the home timeline, season routes, museum, and car/person/team/technology subject pages. Search covers titles/subtitles/aliases plus years and relationship titles, museum cards expose timeline return links, and entity enrichment now includes season, person, car, technology, and team relationship payloads plus block/media resolution. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-e01-e05.*` and `/tmp/f1-qa-us-g02a.*`. |
| US-C01 - Browse every season on the track | Done on 2026-07-11 | Completed child stories US-C01.1 through US-C01.8. The timeline shell now includes the full 76-season demo sequence, normative geometry, decade jumping, decorative-car movement, nearby-card emphasis, highlighted-season treatment, reduced-motion behavior, and a repeatable Lighthouse mobile audit across 320px, 390px, and 430px viewports with all budgets passing. The route still uses clearly labeled demo season data until Epic G authors the researched 1950–2025 repository content, but the interaction/performance envelope is now verified and ready for that content swap. |
| US-C01.1 - Render the complete season sequence | Done on 2026-07-12 | Added `src/timeline/sequence.ts` (`validateSeasonSequence`/`validateSeasonRange`) detecting gaps and duplicate years in a season list, and closed the final acceptance gap by wiring it into CI against shipped data instead of fixtures only. The home page's actual 76-season demo payload now lives in `src/timeline/demo-seasons.ts`, and `tests/unit/timeline-sequence-integration.test.ts` asserts that it covers every year from 1950 through 2025 exactly once; the same test also loads the repository-authored seasons through `getContentRepository()` and asserts that whatever real content exists remains gap-free and duplicate-free within its authored range. Verified `npm run ci` in the working tree and a focused isolated QA copy under `/tmp/f1-qa-us-c01-1.izWomR.*`. |
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
| US-D03 - Hear representative engine audio | Done on 2026-07-11 | Replaced the `audio` block's native `<audio controls>` element with explicit play/pause and stop buttons plus a live duration readout, keeping `preload="none"` and no autoplay so playback only ever starts on deliberate interaction. Unmounting the player (e.g. navigating to another season) pauses and resets playback, and a failed load falls back to a safe text message without blocking the rest of the page. Added dedicated component tests for explicit play/pause/stop, duration formatting, load-failure fallback, and unmount-triggered stop, plus a season-page test proving the block renders without blocking sibling content. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-d03.*`, and interactively confirmed play/pause/stop and duration tracking in the browser preview. |
| US-E01 - Browse the museum | Done on 2026-07-11 | Added `/museum`, backed by `ContentRepository.listMuseum()`, with a client `MuseumBrowser` tab switcher (车辆/人物/科技) that persists the selected tab and scroll position to `sessionStorage` (`f1-museum-state`) and restores them on return. Each card links to its canonical entity route and, when the underlying document resolves to a season, a "查看时间轴" link back to that season's timeline position (`ContentRepository`'s new `timelineHref`, derived from a car/person/technology's representative season). Added `loading.tsx` and a client `error.tsx` boundary for the loading/content-error states, and an empty-state message per tab when no entities are published yet. The home page's "博物馆" link now points at the real route instead of the `#diagnostics` stub. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-e01-e02.*`, and confirmed tab switching and the empty state in the browser preview against the (currently empty) real `content/` directory. |
| US-E02 - Search the museum | Done on 2026-07-11 | Extended `ContentRepository.search()` to match not only titles/subtitles/aliases but also years (season year, championship years, active-year ranges) and relationship titles (resolving a fixed set of `*Id`/`*Ids` relationship fields to their referenced entities' titles), so a query like a team name or a season year surfaces entities that only reference it indirectly. Wired a `searchMuseum` server action (`src/app/museum/actions.ts`) into `MuseumBrowser`'s search form, computed from the same in-memory published content graph with no runtime database. Results show a type label (赛季/车辆/人物/车队/年代/科技) and subtitle for historical context, and a no-results message renders for queries with no matches. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-e01-e02.*`, and confirmed a live no-match search round-trip through the real server action in the browser preview. |
| US-E03 - Learn about a car | Done on 2026-07-11 | Added `/cars/[slug]`, backed by a new `ContentRepository.getEntityBySlug("car", ...)` enrichment (`CarView`): engine, win count, localized specifications, constructor, drivers, seasons, and technologies, all resolved to canonical-route cards. A generic `sources: EntityCard[]` field was added to `EntityView` (resolved from every entity's common `sourceIds`) so every subject page, not just cars, can cite its sources. The route renders common fields, a specification table, bidirectional links to the constructor/drivers/seasons/technologies, sources, story blocks via the existing block registry, and a "在时间轴上查看" CTA to the car's representative season — proving the same season/media/related-entity machinery generalizes to a non-season entity type without new registry code. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-e03-e05.*`, and confirmed the full car → team → back-to-museum navigation loop in the browser preview against real (fixture-derived) demo content. |
| US-E04 - Learn about a person | Done on 2026-07-11 | Added `/people/[slug]`, backed by a new `PersonView` enrichment: person kind (driver/engineer/designer/principal, localized), nationality, active-year range, championship years, teams, representative seasons, and a derived `cars` list (cars whose `driverIds` include this person — not stored on the person document itself, the same reverse-relationship pattern as the existing `racesWon`). One template renders all four person kinds without branching, satisfying "no separate page templates." Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-e03-e05.*`, and confirmed the profile, achievements, and bidirectional team/car/season links in the browser preview. |
| US-E05 - Learn about a technology | Done on 2026-07-11 | Added `/technologies/[slug]`, backed by a new `TechnologyView` enrichment: category and difficulty (both localized), related cars and seasons, a derived `relatedTechnologies` list (other technologies sharing at least one car, since the schema has no direct technology-to-technology field), and a representative season (`firstSeasonId`, falling back to the first `seasonIds` entry) surfaced as a prominent "在时间轴上查看" timeline action. Reuses the same article/diagram/animation/3D block rendering already proven in US-B02.5-7, so every presentation type shares this page's surrounding contract. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-e03-e05.*`, and confirmed category/difficulty labels, related-entity links, and the timeline CTA in the browser preview. |
| (supporting) `/teams/[slug]` | Done on 2026-07-11 | Added a minimal team detail route (team kind, base country, people/cars/seasons, sources, story blocks) — not a numbered backlog story, but required so the constructor links surfaced from US-E03/E04 resolve to a real page instead of a dead link. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-e03-e05.*`. |
| US-F01 - View responsive photographs and galleries | Done on 2026-07-11 | Already satisfied by the `image`/`gallery` renderers from US-B02.3 (content-authored responsive `<picture>` variants grouped by MIME type, reserved aspect-ratio dimensions, focal-point cropping, captions/credits, per-item failure isolation, a runtime `onError` fallback) and the media-asset validation from US-B03 (variant/MIME/byte-budget enforcement at the content layer, which is what "generates" the responsive variants this renderer consumes). No new renderer code was needed; this story is now additionally proven end-to-end through real subject-page usage (US-E03's car specifications and media, not just the isolated home-page preview). No further action beyond the existing `npm run ci` coverage from US-B02.3/US-B03. |
| US-F02 - Explore a 3D model | Done on 2026-07-11 | The lazy-loaded viewer (`next/dynamic({ssr:false})`), WebGL-support fallback, offscreen `IntersectionObserver` pause, reduced-motion auto-rotate disable, touch/pointer orbit, and arrow-key rotation were already in place from US-B02.7. Closed the one missing acceptance criterion — a reduced-data state — by adding `useSaveDataPreference` (`src/blocks/media/use-save-data.ts`, mirroring the existing `useReducedMotion`/`useWebglSupport` `useSyncExternalStore` pattern around the Network Information API's `saveData` flag) and a `data-warning` viewer state: when the device reports a data-saver preference, tapping the poster's launch control shows an explicit "仍要加载 3D 模型" confirmation instead of downloading the model immediately, so an additional network-cost decision is never made silently. Added a jsdom `IntersectionObserver` stub to `tests/unit/setup.ts` (previously only exercised in a real browser) so this state is unit-testable. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-epic-f.*`; confirmed the default (non-data-saver) poster-tap-to-3D-canvas path in the browser preview, and the data-saver confirmation gate via an automated test (the Network Information API can't be reliably overridden before initial mount through the interactive browser tool, since it requires a fresh page load with the preference already set). |
| US-F03 - View technical animation or diagram | Done on 2026-07-11 | Already satisfied by the `diagram`/`animation` renderers from US-B02.5: `diagram` always pairs an image with a required textual explanation (so labels/content have a textual equivalent independent of any zoom/viewport concern), and `animation` is driven by real `<video>` `play`/`pause` events with an explicit pause control, autoplays only when `prefers-reduced-motion` is not set, and always renders a poster frame plus the same required textual explanation. Both are reachable only through the allowlisted block-type registry (`src/blocks/block-registry.tsx`), so content can never configure an arbitrary renderer. No new renderer code was needed; proven end-to-end through US-E05's technology page in addition to the existing home-page preview. |
| US-G01 - Maintain a research record | Done on 2026-07-11 | Already enforced at the schema level since US-B01.1/US-B01.4: every common entity requires a non-empty `sourceIds`, and every `source` document requires `sourceType`, `url`, `accessedOn`, and at least one `supportedClaims` entry naming the field it backs. Populating the real 1988 reference season (US-G02A) is the first time this was exercised with genuine sources rather than fixtures: 11 real source records citing Wikipedia (orientation/cross-checking) and the official formula1.com and Honda Global pages (for consequential technical/statistical claims), with every quoted number paraphrased rather than copied. No new code needed; this row records that the existing contract was validated against real content. |
| US-G02 - Populate a season research packet | Done on 2026-07-12 | Added a "Season research packet checklist" to `content/README.md` covering every required field (champion/car, every race, standings with the Top-3-default rule, entrants, technology/regulation topics, Chinese editorial prose, sourcing, and explicit disclosure of anything scoped down or left unpopulated), written against and validated by the real US-G02A 1988 content. The final blocker from the previous pass was the acceptance-gate QA check: that is now closed by an independent QA review of the expanded 1988 packet against the agreed source hierarchy (Formula1.com first for standings, Wikipedia for entrant-grid orientation/cross-checking), plus a fresh isolated-copy `npm run ci` pass. This makes the checklist and review workflow an actually exercised, reusable season template rather than documentation only. |
| US-G02A - Validate the 1988 reference season | Done on 2026-07-12 | The 1988 reference season is now complete at the intended launch depth in `content/`: era, season, all 16 championship races with real winners/dates/circuits, 16 real circuits, the championship-winning car (McLaren MP4/4, with real chassis/gearbox/suspension specifications from Honda's official site), all 18 entrant cars, complete driver standings through every classified championship participant (36 stored entries, with the Top 3 still the default presentation), complete constructor standings through all 18 listed constructors, the linked constructor/team and driver roster needed to resolve those standings, one technology (Honda RA168E) carrying all three required presentation contracts (a richText article, a real `animation` of the turbo cycle, and a real `model3d` of the engine — reusing existing original demo assets, not fabricated placeholders), and reviewable sources. Verified the primary journey earlier in-browser (timeline deep link → season → car/person/technology subject pages → back to the correct timeline position) and kept that route family green after the content expansion with fresh repository/page tests, full `npm run ci` in the working tree, and a second full `npm run ci` in an isolated QA copy under `/tmp/f1-qa-us-g02a-complete.*`. The automated accessibility route suite now reruns green against `/seasons/1988`, and an independent QA agent separately spot-checked the expanded standings and entrant coverage against Formula1.com and Wikipedia and accepted the story as done. While authoring the reference slice, we also closed two real architecture gaps that only surfaced once real content existed: `ContentRepository.resolveBlocks()` now bridges schema-level media references into renderer-ready blocks, and `mediaAsset` documents are no longer silently dropped by the published-only filter. |
| US-G04 - Record corrections transparently | Done on 2026-07-12 | Added a dedicated correction helper, `tools/content/record-correction.mjs` (`npm run content:correction -- <entity-json-path> --reviewed-by "<name>"`), which updates a corrected entity's `reviewedBy` and `updatedAt` metadata so material factual/editorial fixes are not left as silent JSON edits. Documented the full correction path in `content/README.md`: make the claim change, run the helper, rerun validation/CI, and use a commit message naming both the corrected claim and the reason (for example, `fix(content): correct 1988 Monza winner source attribution`), which satisfies the git-history traceability requirement. Covered by dedicated unit tests for metadata updates, dry-run behavior, and required reviewer enforcement. Verified `npm run ci` in the working tree and an isolated QA copy under `/tmp/f1-qa-us-g04.VLQsQN.*`. |
| US-G05 - Report a content mistake | Done on 2026-07-12 | Added a shared learner-facing correction flow for season, car, person, and technology detail pages: each page now renders a keyboard-accessible "报告内容问题" action that opens a prefilled `mailto:` draft to `NEXT_PUBLIC_FEEDBACK_EMAIL` with the page title, canonical URL, entity type, entity ID, application version, and content version, plus prompts for the suspected mistake and supporting source. Because browsers cannot reliably detect whether a mail client actually launched, each page also ships an explicit in-page fallback panel ("无法打开邮件？查看手动反馈方式") that keeps the current content visible, reveals the configured feedback address, and exposes a copyable page-reference textarea with the same identifiers for manual reporting. Covered by a dedicated `content-feedback` helper/component test plus page-level assertions across `/seasons/[year]`, `/cars/[slug]`, `/people/[slug]`, and `/technologies/[slug]`. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-g05.zEs72g.*`. |
| US-H01 - Use the application accessibly | Done on 2026-07-11 | Added an automated route-family accessibility baseline using `axe-core` against the real home, season, museum, car, person, and technology routes (`tests/unit/accessibility-routes.test.tsx`) and recorded the manual WCAG 2.2 AA release checklist in `docs/accessibility/us-h01-manual-audit.md`. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-epic-h.*`. |
| US-H02 - Meet performance budgets | Done on 2026-07-11 | Added `npm run perf:routes`, a repeatable Lighthouse mobile audit for representative route families (`/`, `/seasons/1988`, `/museum`, `/cars/mclaren-mp4-4`, `/people/ayrton-senna`, `/technologies/honda-ra168e`) writing committed evidence to `docs/performance/us-h02-route-family-performance.{json,md}`. The current real-content route set passes the PRD mobile budgets with median LCP from 2183–2337ms, CLS 0, script 155.0–161.6KB, and image bytes 0–10.6KB; INP was locally proxied by TBT where Lighthouse did not emit it. Added `.github/workflows/quality-audits.yml` so this audit is reported in CI and uploaded as an artifact. Verified `npm run ci` and `npm run perf:routes` in the working tree and in an isolated QA copy under `/tmp/f1-qa-epic-h.*`. |
| US-H03.1 - Expose diagnostic versions | Done on 2026-07-11 | Already exposed via `/api/diagnostics` (US-A02: `appVersion`, `contentVersion`, `gitSha`, `generatedAt`). This story closes the second half of the acceptance criterion — attaching those versions to error reports — via `src/lib/error-reporting.ts`, which fetches `/api/diagnostics` client-side (cached after the first call) and attaches `appVersion`/`contentVersion` to every renderer-failure and route-error report. |
| US-H03.2 - Report route and renderer errors | Done on 2026-07-11 | Added a root `src/app/error.tsx` (route-level) and `src/app/global-error.tsx` (root-layout-level) error boundary, replacing the one-off boundary that previously existed only under `/museum`. Both report the failing route, the error's `digest`/message, and diagnostic versions via `reportRouteError`. Wired `reportRendererFailure` into every media component's existing failure path (`image`/`audio`/`video`/`animation`'s `onError`, and a new `componentDidCatch` on `Model3DErrorBoundary`), each reporting its `kind` and `mediaId` alongside diagnostic versions — no user-facing behavior changed, since every component already had a working fallback UI; this only adds the missing operational signal. There is no real error-tracking SDK wired up yet, so the sink is a structured `console.error` for now, documented as swappable for a real APM call without touching any caller. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-us-h03.*`, with dedicated tests for the reporting helper, the route error boundary, and `Model3DErrorBoundary`'s `componentDidCatch`, and confirmed no console errors/regressions when loading real season/technology pages in the browser preview. |
| US-H03.3 - Protect the last valid deployment | Done on 2026-07-11 | Recorded and verified the deployment protection chain in `docs/OPERATIONS.md`: `main` is guarded by `.github/workflows/ci.yml`, `.github/workflows/deploy-production.yml` reruns `npm run ci` before any production release, and Vercel production deploys remain immutable `--prebuilt` swaps so a failed build or failed publish cannot replace the last successful deployment. |
| US-H03.4 - Monitor production assets | Done on 2026-07-11 | Added `npm run ops:check-assets` (`tools/ops/check-asset-health.mjs`), which checks every declared media asset source, reports broken media IDs together with the referencing entities, and runs in `.github/workflows/quality-audits.yml` with uploaded JSON artifacts. Verified locally and in an isolated QA copy under `/tmp/f1-qa-epic-h.*`. |
| US-H03.5 - Report media-rights expiry | Done on 2026-07-11 | Added `npm run ops:rights-report` (`tools/ops/report-rights-expiry.mjs`), which reports non-publishable media rights statuses plus any `rights.expiresAt` value within a 30-day warning window or already expired, and runs in `.github/workflows/quality-audits.yml` with uploaded JSON artifacts. The current real content returns no blocked or expiring assets. Verified locally and in an isolated QA copy under `/tmp/f1-qa-epic-h.*`. |
| US-H03.6 - Route actionable alerts | Done on 2026-07-11 | Added `docs/OPERATIONS.md` with severity, owner, acknowledgement window, escalation path, and required resolution evidence for deploy failures, broken assets, and rights-expiry alerts. |
| US-H03.7 - Verify analytics privacy | Done on 2026-07-11 | Documented the current privacy baseline in `docs/OPERATIONS.md`: the project ships no third-party analytics SDK, and the existing diagnostics/error-reporting paths collect only technical version/context data, never search text, feedback drafts, or personal identifiers. |
| US-H03.8 - Exercise smoke testing and rollback | Done on 2026-07-11 | Added `npm run ops:smoke` (`tools/ops/smoke-test.mjs`) to verify the primary production routes against a target deployment URL, and documented the smoke-test and rollback procedure in `docs/OPERATIONS.md`. Verified locally against a production `next start` instance and in an isolated QA copy under `/tmp/f1-qa-epic-h.*`. |
| (correction) Rebuild the home page around the actual timeline | Done on 2026-07-11 | The home page (`src/app/page.tsx`) had accumulated a "preview" section per story (block registry, prose blocks, media, related entities, diagram/animation, audio/video, 3D model, season-card styles, deployment diagnostics, dev-command list) appended one after another as each backlog story landed, so real content could be eyeballed during development. With real subject pages (Epic E) and real content (Epic G) now doing that job for real, those sections were dead scaffolding — and critically, they buried the actual timeline as item 10 of 13 sections instead of it being the app. Rebuilt `/` to match `design/F1 赛道年代记.dc.html` and its screenshots exactly: header (brand mark, subtitle, 博物馆 link) directly above the interactive timeline, nothing else. Removed the now-dead demo data/JSX from `page.tsx` (658 lines) and its now-unused CSS (`.hero-panel`/`.hero-road`/`.road-*`, `.season-grid`/`.season-card`, `.info-grid`/`.info-card`, `.command-row`/`.command-pill`, `.story-badge`, the desktop 2-column `.home` override — 321 lines), keeping only classes still used elsewhere (`.chip`/`.chip-row`, `.eyebrow`, `.cta`, `.section-card` family, `.block-preview-stack`). Rewrote `tests/unit/page.test.tsx` to assert the header and the real timeline instead of the removed demo sections. Verified `npm run ci` in the working tree and in an isolated QA copy under `/tmp/f1-qa-home-rebuild.*`, and visually compared the rebuilt home page against `design/screenshots/01-主屏-赛道顶部.png` and `02-主屏-赛道中段-小车行驶.png` at mobile and desktop widths, plus re-verified the full timeline → real 1988 season → back-to-timeline loop. |
| (correction) Fix ordinary node size and car/node/card road drift below 390px | Done on 2026-07-11 | Found via user-annotated side-by-side screenshots against the prototype, two real bugs beneath the pixel-value-accurate geometry (US-C01.2): (1) the global `button { min-height/min-width: 44px }` touch-target baseline (US-A03) was inflating ordinary (non-highlighted) `.timeline-node` buttons from the correct 24px to 44px — highlighted nodes render as `<Link>` (an `<a>`, not a `<button>`) so they were unaffected and stayed correct at 30px; fixed by giving `.timeline-node` an explicit `min-width/min-height: 0` override. (2) The road SVG's `preserveAspectRatio="xMidYMin meet"` uniformly scales its 390-unit-wide coordinate system to fit whenever the responsive `.timeline-track` renders narrower than 390px (i.e. on most real phone widths, including the explicitly-required 360×800 baseline) — verified this compresses the drawn path by the width ratio in *both* axes (e.g. a path spanning 8966 viewBox units rendered only 7767px tall at 375px width), while the node/card/car elements are plain CSS-absolute siblings positioned in literal, unscaled pixels, so they drifted further off the (compressed) path the more a viewport deviated from 390px — most visible on the small car icon, which needs to sit precisely on the road rather than just near it. Fixed by changing `preserveAspectRatio` to `"none"` (vertical axis then always maps 1:1, since box height already always equals viewBox height numerically) and converting every horizontal pixel position that plain-CSS sibling elements share with the SVG's coordinate space — the two node `left` styles, the car's position (split out of its `translate()` transform into a `left: calc(<percent> - 13px)` plus a rotate-only transform), and the ordinary/highlighted card and popover `left` values in CSS — from literal pixels to percentages of the same 390-unit space (`toXPercent()` in `Timeline.tsx`). Verified by direct `getBoundingClientRect()` measurement of the path and node positions at 320px, 375px, and 390px (confirming zero drift, not just visual inspection), full `npm run ci` in the working tree and an isolated QA copy, and re-confirmed popover open/close still functions correctly after the positioning change. |
| US-G03.4 - Populate and verify 1980-1989 | Done on 2026-07-12 | Populated the remaining nine 1980s seasons (1980-1987, 1989; 1988 already done in US-G02A) against the US-G03 minimum-completeness contract: each season has a real champion/champion car, every championship race with a real circuit/date/winner (and `winnerCarId` when the champion's own car won that round), complete driver and constructor standings, a Chinese season summary plus `richText` story block, and at least one technology topic. Data was fetched live from formula1.com's official per-year race/driver-standings/constructor-standings pages via the existing `tools/content/f1-results-parser.mjs`, cross-checked against Wikipedia for calendar/circuit orientation (`source-wikipedia-1980s-f1-calendar`), and generated through a scratch script rather than hand-authored per season given the volume (9 seasons × ~16 races). Real research decisions made along the way: resolved every ambiguous venue name to the correct year-specific circuit (Great Britain alternated Silverstone/Brands Hatch; France and Switzerland both ran at Dijon-Prenois in specific years; Belgium ran at Spa only in 1983, Zolder otherwise; Spain moved from Jarama to Jerez after 1981; Europe meant Brands Hatch in 1983 and the Nürburgring GP-Strecke otherwise); merged the official constructors' table's per-engine-partner rows (e.g. "Arrows Ford"/"Arrows BMW" as separate rows in the same season) into one entry per chassis constructor before ranking, since this content model has no engine-partner axis on `team`; and used rank order (not the source page's repeated tied position numbers) for standings positions, matching the sequential-position convention already established by 1988. Scope, matching the story's "reuse 1988 without weakening its richer contract" instruction: each season's `entrantCarIds` covers only the champion's own car (not the full grid, as 1988 alone does), and the four technology topics (`ground-effect-aerodynamics`, `flat-bottom-rule`, `1980s-turbo-boost-era`, `na-35-era`) are shared across the years they actually apply to rather than duplicated per season — both disclosed here rather than implied as complete. Existing people who raced for a newly-added team this decade (e.g. Nelson Piquet at Brabham and Williams, Alain Prost at Renault) had their `teamIds`/`representativeSeasonIds` backfilled, and the two existing champions in this batch (Piquet: 1981/1983/1987, Prost: 1985/1986/1989) had real `championshipYears` added. Verified `npm run validate:content`, `npx tsc --noEmit`, `npx vitest run` (196 tests), and full `npm run ci` (format/lint/typecheck/test/validate:content/build) in the working tree, plus in-browser spot checks of `/seasons/1982`, `/seasons/1984`, and `/seasons/1989` and confirmation that the new cars/teams surface correctly on `/museum`. |
| US-G03.5 - Populate and verify 1990-1999 | Done on 2026-07-12 | First batch under the breadth-first priority pivot above: populated all 10 seasons of the 1990s (season, every championship race, complete driver/constructor standings, champion car, Chinese summary, technology topic), reusing and generalizing the 1980s decade's generator script. One process improvement made here: the script now loads existing people/teams/circuits directly from `content/` at startup instead of hardcoding them, so it stays correct without manual bookkeeping as more decades are added. Real research/generation decisions: resolved every venue that moved mid-decade to its correct year-specific circuit (Brazil to Interlagos from 1990, France to Magny-Cours from 1991, Spain to Circuit de Barcelona-Catalunya from 1991, Australia to Albert Park from 1996, Austria to the rebuilt A1-Ring for 1997-1998, and the wandering "European"/"Luxembourg"/"Pacific" grands prix to Donington Park (1993), Jerez (1994, 1997), the Nürburgring GP-Strecke (1995, 1996, 1997/1998 as Luxembourg GP, 1999), and TI Circuit Aida (1994-1995) respectively); and deliberately did not attempt to fold sponsor-driven team rebrands (Arrows/Footwork, March/Leyton House, Larrousse/Lola/Venturi, Ligier/Prost) into single continuous team records, instead giving each distinct name F1.com's official results used its own team entity — the safer default until someone does the deeper lineage research, since guessing wrong there would look like a factual error rather than an acknowledged gap. Added the missing `era-1990s` entity and, while there, fixed `era-1980s.seasonIds` (it had only ever listed `season-1988`, never updated when the other nine 1980s seasons were added). Consistent with the priority pivot, editorial depth is intentionally shallow: new drivers' `title.zh` is a placeholder equal to their English name (not yet translated), and season summaries are shorter than the 1980s batch's. Verified `npm run validate:content`, `npx tsc --noEmit`, `npx vitest run` (196 tests), full `npm run ci`, a from-scratch isolated QA copy, and in-browser spot checks of `/seasons/1994` and `/museum`. |
| US-G03.6 - Populate and verify 2000-2009 | Done on 2026-07-12 | Populated all 10 seasons of the 2000s using the same generator pattern as the 1990s batch. This decade had the heaviest circuit/team churn of any batch so far: 8 new circuits (Indianapolis's road course for the US GP through 2007, Bahrain and Shanghai from 2004, Istanbul Park from 2005, Marina Bay from 2008 as F1's first night race, Yas Marina in 2009, Valencia's street circuit for the European GP from 2008, and Fuji Speedway standing in for Suzuka in 2007-2008) and 11 new teams (BAR, Honda, Jaguar, Midland F1, Spyker, Force India, Toyota, Super Aguri, Toro Rosso, Red Bull, Brawn GP). Consistent with the no-lineage-folding rule from the 1990s batch, multi-year rebrand chains (Jordan to Midland to Spyker to Force India; Stewart to Jaguar; BAR to Honda) each got their own distinct team entity rather than a guessed-at merged history — the one exception was folding "RBR"/"Red Bull", since F1.com's own results pages used both strings for the same team in the same continuous run rather than marking an actual rebrand. One real bug caught here: a `championDriver` name typed as plain-ASCII "Kimi Raikkonen" didn't match the accented "Kimi Räikkönen" string the driver-standings data (and the already-created person record) actually used, silently producing a different slug and a broken `championPersonId`/car `driverIds` reference — `validate:content` caught it immediately, and the fix was matching the exact source-data spelling. Verified `npm run validate:content`, `npx tsc --noEmit`, `npx vitest run` (196 tests), full `npm run ci`, a from-scratch isolated QA copy, and an in-browser spot check of `/seasons/2009` (Brawn GP's title-winning season). |
| US-G03.7 - Populate and verify 2010-2019 | Done on 2026-07-12 | Populated all 10 seasons of the 2010s. A calmer calendar era than the 2000s: only 6 new circuits (Korea International Circuit 2010-2011, Buddh International Circuit 2011-2013, Circuit of the Americas from 2012, Sochi Autodrom from 2014, Baku City Circuit from 2016 (branded "European GP" its first year, "Azerbaijan GP" from 2017), and the rebuilt Red Bull Ring for Austria's 2014 return) and 10 new teams (Mercedes, Caterham, HRT, Virgin, Marussia, Manor, Haas, Racing Point, plus two deliberately-not-folded name reuses: "Lotus F1 Team" and "Alfa Romeo Racing"). Those last two are the one departure from the otherwise-consistent no-lineage-folding rule: unlike Arrows/Footwork or RBR/Red Bull (the same company, just a different display string), the 2010s "Lotus" and "Alfa Romeo Racing" were different racing organizations (the ex-Renault/Genii Capital team and Sauber, respectively) that licensed those historic names from unrelated companies — reusing the existing 1980s team-lotus/team-alfa-romeo records for them would have wrongly merged two unrelated teams' cars and drivers into one entity, which is a worse error than the acknowledged gap of a separate record. One real bug caught by `validate:content`: the 2016 "Europe" (Baku) circuit case only returned a bare `{ slug }` while the 2017 "Azerbaijan" case carried the full name/location/country metadata, so whichever year's races were processed first silently won and the loser left the circuit record with empty required fields — fixed by having the 2016 branch just delegate to the "Azerbaijan" resolution instead of duplicating (and risking drifting from) its metadata. Verified `npm run validate:content`, `npx tsc --noEmit`, full `npm run ci`, a from-scratch isolated QA copy, and an in-browser spot check of `/seasons/2016` (Rosberg's title-clinching, career-ending season). |
| US-G03.8 - Populate and verify 2020-2025 | Done on 2026-07-12 | Populated the initial-release boundary's final six seasons (2020-2025), completing every season from 1950 through 2025 except the 1950s/1960s/1970s still pending. 2020 was the hardest single season resolved so far: the COVID-shortened, 17-round calendar reused several circuits twice under different Grand Prix names in the same year (Austria/Styria both at the Red Bull Ring, Great Britain/70th Anniversary both at Silverstone, Bahrain/Sakhir both at Bahrain International Circuit), plus one-off venues (Mugello for the "Tuscan GP", the Nürburgring for the "Eifel GP", Imola returning as "Emilia Romagna GP"). Added 6 new circuits overall (also Portugal's return at the different, newly built Algarve International Circuit rather than the old Estoril, plus Qatar/Losail, Saudi Arabia/Jeddah, Miami, and Las Vegas as the calendar expanded) and 6 new teams (AlphaTauri, Alpine, Aston Martin, Kick Sauber, RB, Racing Bulls). Kept the established no-lineage-folding rule throughout, including for two long-running rebrand chains that now span four total distinct entities each under this rule: Toro Rosso (2006-2019) -> AlphaTauri (2020-2023) -> RB (2024) -> Racing Bulls (2025), and Sauber (2000s-2018) -> Alfa Romeo Racing (2019-2023, from the 2010s batch) -> Kick Sauber (2024-2025) - the latter chosen for consistency with how Alfa Romeo Racing was already treated as a standalone entity in the 2010s batch, even though Sauber's Hinwil factory has in fact run continuously under all of those sponsor names. Verified `npm run validate:content` (clean on the first run), `npx tsc --noEmit`, full `npm run ci`, a from-scratch isolated QA copy, and in-browser spot checks of `/seasons/2025` (McLaren's first drivers' title since 2008) and `/seasons/2020` (confirming the doubled-up circuit names resolved correctly). |

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

**Priority pivot (2026-07-12, product owner directive):** For the first release, breadth takes priority over depth — every one of the 76 seasons must have a real, schema-valid, sourced record (no empty/missing years), even where that record is intentionally thinner than the minimum completeness contract below (e.g. an English driver name standing in for an untranslated Chinese title, or a shorter season summary). A dedicated content pass will polish each season toward the full contract after that first release ships. This does not relax the "no fabrication, no empty placeholders" rule — every fact still traces to a real source — it only accepts shallower editorial depth per season in exchange for complete year-by-year coverage sooner.

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
