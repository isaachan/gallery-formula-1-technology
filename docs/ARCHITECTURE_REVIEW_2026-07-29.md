# Architecture Review

**Date:** 2026-07-29
**Status:** Open — prioritize P0 items before the next iOS release candidate
**Scope:** Repository architecture, content pipeline, static export, iOS WebView packaging, delivery, security, observability, performance, and quality gates.
**Implementation plan:** [Architecture Review Implementation Plan](./ARCHITECTURE_REVIEW_IMPLEMENTATION_PLAN_2026-07-29.md)

## Executive summary

The application has a sound content-driven foundation: repository-managed content, normalized domain concepts, reusable block renderers, static export, and media fallbacks all fit the product well. The main architectural concern is that the implementation currently sits between two delivery models:

- the application is exported as static content and will be packaged in an iOS app; and
- portions of the documentation and automation still assume a conventional Vercel-hosted web application with API endpoints, HTTP security headers, and immediate web publication.

The delivery model must be made explicit. Production is an iOS static-content package, not a server-rendered web application. This changes how asset URLs, security controls, diagnostics, release rollback, and verification must work.

## Review basis

- Product and architecture documents: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_PLAN.md`, and `docs/ENGINEERING_DISCIPLINE.md`.
- Current production configuration: `next.config.ts` uses `output: "export"` and disables Next.js image optimization.
- Build evidence: `npm run validate:content` and `npm run build` passed during this review. The static build generated 1,345 pages and approximately 321 MB of output, including approximately 206 MB of images.
- Test evidence: the default `npm test` run had 208 passing tests and one timeout in the home-route accessibility test. The same accessibility suite passed when run with a targeted 20-second timeout.
- Static-host reproduction: `/search-index.json` returned 200, while `/museum/search-index.json` and `/api/diagnostics` returned 404.

## Architecture decisions to confirm

The product owner and engineering lead should explicitly confirm the following before completing the P0 work:

1. **Content release model** — Does content ship only in signed App Store releases, in signed/versioned content packs, or through a constrained remote-update service?
2. **Media availability model** — Which media must work fully offline, which may be remote, and what cache/size budgets apply?
3. **Deep-link model** — Are Universal Links, a public web companion, or only in-app links required at launch?
4. **Telemetry policy** — Is privacy-preserving operational telemetry approved for the iOS app? If so, define events, retention, consent, and the native/JavaScript boundary.

Until these decisions are made, do not treat the existing Vercel production workflow as the complete production-release mechanism.

## Prioritized improvement backlog

### P0 — release blockers

#### AR-01: Validate every declared content reference

**Problem**

The graph validator verifies several core relationships but does not verify every reference declared by the common entity and block contracts. In particular, `sourceIds`, `coverMediaId`, block `sourceIds`, block `mediaId`/`mediaIds`, and `relatedEntities.entityIds` are validated only as non-empty strings in some cases, not as existing targets of the required type. The content repository then treats missing media/entity references as absent, allowing the page to degrade without a build failure.

**Why it matters**

This violates the editorial-trust contract. A typo can silently remove a source, hero image, rich-media presentation, or related link from the shipped app.

**Required change**

- Create one exhaustive reference collector used by graph validation and generated-graph compilation.
- Verify existence and target type for every reference field, including nested block fields and common entity fields.
- Add reverse-link invariants where the domain requires them.
- Fail the build for unresolved published-content references; retain only deliberate learner-facing runtime fallbacks for post-build asset load failures.
- Add fixtures for each reference family and a regression test showing that every invalid reference fails validation.

**Acceptance criteria**

- A missing or incorrectly typed published reference fails `npm run validate:content` with entity ID, field path, expected type, and actual target/type.
- The generated graph contains no unresolved internal references.
- Runtime block fallback is exercised only for browser/device/media delivery failures, not invalid repository content.

**Primary implementation locations**

- `tools/content/validate-content.mjs`
- `src/domain/common-entity.mjs`
- `src/content/content-repository.ts`
- `tests/unit/validate-content.test.mjs`

#### AR-02: Make static asset resolution independent of the current route

**Problem**

Museum search calls `fetch("search-index.json")`. From `/museum/`, a browser or WebView resolves it as `/museum/search-index.json`; that file is absent. The client catches the failure and returns an empty result set, which appears to the learner as a valid search with no matches.

**Why it matters**

The failure exists in a static web host and is more sensitive in an iOS bundle, where `file://` or a custom WebView scheme may not have a conventional site root.

**Required change**

- Define one build-time/static-runtime asset resolver with an explicit application asset base.
- Use it for the search index and all future generated shared artifacts.
- Make the wrapper provide or compile the same base for its local bundle scheme.
- Surface an actual search availability error when index loading fails; do not convert a transport failure to an empty search result.
- Test root, nested route, offline WebView/custom-scheme, and optional web-preview variants.

**Acceptance criteria**

- Search works from `/`, `/museum/`, subject routes, and the packaged iOS app.
- The index load path is deterministic and does not depend on browser pathname resolution.
- A missing index produces an accessible, actionable unavailable-state message.

**Primary implementation locations**

- `src/lib/client-search.ts`
- `src/components/museum-sheet.tsx`
- iOS wrapper configuration and integration tests

#### AR-03: Establish the iOS WebView security boundary

**Problem**

HTTP response headers are not a primary security boundary for content bundled inside an iOS app. The PRD requires a restrictive CSP and approved media origins, but the static local runtime cannot rely on a CDN to provide these controls.

**Why it matters**

The app processes repository content and potentially remote media. Security must be enforced at the WebView/native boundary as well as during content ingestion.

**Required change**

- Configure `WKWebView` navigation policy to allow only the local bundle scheme and approved remote origins.
- Use a minimal, allowlisted JavaScript bridge; do not expose generic native invocation.
- Keep content/block allowlisting and sanitization as the first boundary.
- Enforce remote media origins during content compilation and native navigation/resource policy.
- Apply CSP and standard security headers to any hosted preview/public-web variant, but do not treat them as sufficient for the iOS package.
- Document App Transport Security, offline-file access, and external-link handling policy.

**Acceptance criteria**

- An unapproved navigation, remote media URL, or script origin is blocked and produces an operationally safe diagnostic.
- Arbitrary authored HTML/scripts cannot execute.
- Native bridge calls are authenticated by origin/message schema and are covered by tests.
- The hosted preview, if retained, exposes a tested restrictive CSP and appropriate security headers.

**Primary implementation locations**

- iOS wrapper project
- `src/domain/media-file-validation.mjs`
- `tools/content/validate-content.mjs`
- deployment configuration for hosted previews

#### AR-04: Replace the obsolete diagnostics contract

**Problem**

Documentation and preview workflow comments advertise `/api/diagnostics`, but static export has no runtime API route and the endpoint returns 404. Current renderer and route failures only call `console.error` with fixed `"static"` version values.

**Why it matters**

Release troubleshooting and rich-media failure measurement cannot rely on browser console output from a packaged app.

**Required change**

- Generate a static build manifest containing app version, content version, build timestamp, and content-pack identifier.
- Decide whether approved operational telemetry is required. If yes, deliver it through a privacy-reviewed native or JavaScript bridge with a constrained event schema.
- Update preview workflow comments, deployment documentation, operations documentation, and smoke tests to match the selected model.
- If no telemetry is approved, remove claims that failures are remotely recorded and document the support/diagnostic collection path.

**Acceptance criteria**

- Every packaged build exposes an accurate, inspectable version manifest.
- No release documentation advertises an unavailable API endpoint.
- Error reporting either reaches an approved collection channel or is explicitly documented as local-only.
- Telemetry contains no search text, feedback drafts, personal identifiers, or arbitrary page content.

**Primary implementation locations**

- `src/lib/diagnostics.ts`
- `src/lib/error-reporting.ts`
- `.github/workflows/deploy-preview.yml`
- `docs/DEPLOYMENT.md`
- `docs/OPERATIONS.md`
- iOS wrapper project

### P1 — complete in the next architecture increment

#### AR-05: Introduce a single generated content graph pipeline

**Problem**

The architecture specifies a validated, normalized graph that emits per-route payloads and compact shared indexes. The current repository parses every raw JSON file at build/render time, while the search-index script implements a separate raw-document parser and separate relationship logic.

**Why it matters**

Duplicated parsing and projection logic will drift as content schemas grow. It also makes a future CMS adapter harder because routes are coupled to the file-shaped document model.

**Required change**

- Create `tools/content/build-graph.mjs` (or equivalent) as the only compilation entry point.
- Run schema validation, graph validation, migrations, relationship derivation, search-index generation, and route-payload generation in one pipeline.
- Make application repositories read generated, typed artifacts rather than source JSON documents.
- Make the production build invoke this pipeline and fail before Next export on content errors.
- Ensure the pipeline honors configured content roots and preview/draft policy.

**Acceptance criteria**

- No application route parses source content files directly.
- Search, timeline, museum, and route payloads derive from one graph artifact and have contract tests.
- `npm run build` cannot succeed with invalid content.
- A future CMS adapter can feed the same normalized graph contract.

**Primary implementation locations**

- `src/content/content-repository.ts`
- `src/content/get-repository.ts`
- `tools/content/build-search-index.mjs`
- `package.json`
- `tools/content/`

#### AR-06: Define signed static-content release and rollback mechanics

**Problem**

Current automation presents Vercel deployment as production release, while the actual learner product will be a packaged iOS app. App Store delivery does not support the documented immediate-publish model.

**Required change**

- Select and record one of the approved content-release models from the architecture decisions above.
- Version the app, content graph, media manifest, and optional remote content pack together.
- If remote packs are used, require signature/integrity checks, compatible-schema checks, atomic activation, last-known-good fallback, and rollback.
- Separate web preview distribution from iOS production release documentation and CI/CD.

**Acceptance criteria**

- The release process identifies exactly which content version ships with an app build.
- A failed update cannot leave learners without the last valid content package.
- Rollback is demonstrated on a device or simulator.
- App Store release steps and web-preview steps are independently documented.

#### AR-07: Treat bundle size and rich-media delivery as iOS release budgets

**Problem**

The static output is approximately 321 MB, including approximately 206 MB of images. Image optimization is disabled. Existing web performance evidence also contains approved LCP exceptions for season, car, and technology routes.

**Required change**

- Establish an IPA/app-download size budget, installed-size budget, and offline-media policy.
- Generate responsive AVIF/WebP variants during media ingestion, with explicit dimensions and byte metadata.
- Keep only offline-critical media in the package; make optional remote media explicit with posters and fallbacks.
- Add content/compiler checks for rendition availability and per-screen/image budgets.
- Test startup and interaction on target low-end supported iPhones, not only desktop Lighthouse.

**Acceptance criteria**

- CI reports application bundle and content-pack size deltas.
- Each representative route satisfies its image/media budget or has a time-bounded, named exception.
- Image renderers select appropriate local or remote variants without layout shift.
- Rich media remains optional and never blocks historical text.

**Primary implementation locations**

- `next.config.ts`
- `src/domain/media-file-validation.mjs`
- `tools/content/`
- `tools/perf/`
- iOS release pipeline

#### AR-08: Load the museum catalogue on demand

**Problem**

The home route passes every car, person, and technology card to a client component before the museum is opened. This produces an approximately 376 KB HTML document before compression and scales with collection size.

**Required change**

- Emit a compact museum index from the generated content graph.
- Load/cache the index only when the learner opens the museum, subject to the chosen offline policy.
- Keep first-open behavior responsive and provide a loading/error state.

**Acceptance criteria**

- The home route contains only timeline and launch-control data.
- Museum data is available offline according to the selected packaging policy.
- First museum open meets a defined interaction budget on target devices.

**Primary implementation locations**

- `src/app/page.tsx`
- `src/components/home-museum-launcher.tsx`
- `src/components/museum-sheet.tsx`
- content graph compiler

#### AR-09: Implement durable internal links and public-web metadata where needed

**Problem**

The domain validates `redirectFrom`, but static redirects are not generated. Sitemaps, robots policy, canonical metadata, structured data, and social metadata are also absent.

**Required change**

- Preserve internal route migrations in the iOS navigator and Universal Link mapping, if enabled.
- Generate static redirects for any hosted preview/public site that supports them.
- Treat sitemap, robots, structured data, and social metadata as conditional on the decision to run a public web companion.

**Acceptance criteria**

- Renamed entities retain a deterministic route migration path.
- Universal Link/public-web requirements are explicitly documented rather than assumed.

### P2 — planned hardening

#### AR-10: Stabilize accessibility test execution

The default test suite currently fails because the home-route axe test exceeds the default five-second timeout, although the suite passes with a targeted 20-second timeout. Use focused fixtures, a route-specific timeout, or a browser-level accessibility strategy with an explicit execution budget. Do not normalize intermittent red CI.

#### AR-11: Consolidate runtime schemas and TypeScript types

Manual `.mjs` validators and broad `unknown` casts can drift from repository projections and renderers. Adopt one discriminated runtime schema that infers TypeScript types and, where useful, generates JSON Schema for authoring tooling.

#### AR-12: Complete localization and URL-state design

The domain accepts locales but current routes always render Chinese and many UI strings are embedded in components. Before adding full English prose or more locales, add locale resolution, centralized UI messages, locale-aware metadata, and a documented fallback policy. Add URL-backed museum filters only when the P2 filtering requirement is scheduled.

#### AR-13: Run performance and operational audits before release candidates

Current route performance audits run after pushes to `main`, which is too late for an iOS release candidate. Run representative static-package performance, bundle-size, asset-health, and device smoke checks on the release branch/CI candidate and retain artifacts with the release record.

## Recommended delivery sequence

1. AR-02 and AR-01: restore correct search and prevent silent content degradation.
2. Confirm the four architecture decisions, then implement AR-03 and AR-04 together.
3. Implement AR-05 and AR-06 before the content volume or editorial workflow grows further.
4. Implement AR-07 and AR-08 together as the iOS performance/package-size increment.
5. Complete AR-09 through AR-13 in the relevant roadmap phases.

## Definition of done for each review item

An item is complete only when it includes:

- an updated architecture decision or operational document where the delivery model changes;
- focused automated tests, including a regression test for the reported failure mode;
- content/schema validation updates when the item affects content;
- iOS simulator or device evidence for WebView, offline, asset, or release behavior;
- accessibility and performance checks when learner-facing behavior changes;
- an explicit rollback or last-known-good behavior for update/release-path changes.

## Out-of-scope observations

The review did not identify a reason to replace the content-driven domain model, typed block registry, static rendering approach, or media-fallback strategy. Those are appropriate foundations for the product when completed with the safeguards above.
