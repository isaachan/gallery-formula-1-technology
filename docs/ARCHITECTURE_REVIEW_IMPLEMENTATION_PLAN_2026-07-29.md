# Architecture Review Implementation Plan

**Date:** 2026-07-29  
**Status:** Approved for implementation — D0 baseline recorded
**Source review:** [Architecture Review](./ARCHITECTURE_REVIEW_2026-07-29.md)  
**Baseline commit:** `0fadb05` (`docs: add dated architecture review`)  
**Delivery target:** Complete AR-01 through AR-04 before the next iOS release
candidate, then deliver AR-05 through AR-09 as the next architecture increment.
AR-10 through AR-13 are planned hardening.

## 1. Objective

Turn the review findings into small, test-driven, releasable increments while
preserving the existing content-driven architecture:

- repository-managed Chinese-first content;
- stable entity and media IDs;
- typed, allowlisted content blocks;
- static Next.js export;
- the `applocal://localhost/` iOS bundle served by `AppSchemeHandler`;
- learner-facing fallbacks for device and asset-load failures.

This plan does not introduce a CMS, a server-rendered production dependency, or
remote content updates without an explicit product and architecture decision.

## 2. Current-state baseline

The implementation already has useful foundations, but the review exposes gaps
between their contracts and their behavior:

| Area | Current state | Gap to close |
| --- | --- | --- |
| Static delivery | `next.config.ts` exports trailing-slash routes; `ios/sync-web-assets.sh` copies `out/` into the app bundle. | The build is not yet a versioned, integrity-checked iOS release artifact. |
| iOS runtime | `AppSchemeHandler` serves `applocal://localhost/`; `WebView.swift` owns navigation. | All HTTP and HTTPS navigation is currently allowed, missing paths fall back to the home document, and there is no native test target. |
| Content validation | `validate-content.mjs` validates many typed relationships and some reverse links. | Common `sourceIds`, `coverMediaId`, nested block references, and related-entity references are not exhaustively collected and type-checked. |
| Repository | `ContentRepository` hides most application queries. | It still parses raw source JSON, silently drops unresolved references, and duplicates search projection logic with `build-search-index.mjs`. |
| Search | A static `public/search-index.json` is generated and the museum has an accessible error state. | `fetch("search-index.json")` is route-relative and converts transport failures into an empty result. |
| Diagnostics | Build-time version helpers exist and pages use them for feedback metadata. | Runtime error reports contain fixed `"static"` versions; `/api/diagnostics` remains in workflow and operations documentation despite static export. |
| Performance | Route audits and media validation exist. | Audits run after pushes to `main`; the package has no IPA/installed-size budget or complete rendition contract. |
| Museum payload | Repository queries support museum cards. | The home route serializes all car, person, and technology cards before the museum opens. |
| Redirects and localization | `redirectFrom` and localized fields validate. | Route migrations are not emitted; locale resolution and UI messages are incomplete. |

The review also conflicts with older source-of-truth statements: the PRD lists
native applications as a first-release non-goal, while the development and
deployment plans describe Vercel as production and immediate merge-to-production
publication. These documents must be reconciled before iOS release mechanics are
treated as approved.

## 3. Decision gate D0

**Decision recorded 2026-07-29:** The recommended baseline below is approved
for this implementation. ADR-006 through ADR-009 in `docs/ARCHITECTURE.md` and
the corresponding PRD, development, deployment, and operations updates define
the release vocabulary and constraints. Numeric iOS/media budgets still require
measurement against the first candidate; until approved, regressions from the
recorded baseline fail the candidate rather than silently raising a budget.

The product owner and engineering lead must record the four decisions below as
ADRs and update `docs/PRD.md`, `docs/ARCHITECTURE.md`,
`docs/DEVELOPMENT_PLAN.md`, `docs/DEPLOYMENT.md`, and `docs/OPERATIONS.md`.
Implementation may start on AR-01, AR-02, and AR-10 while this gate is open, but
AR-03, AR-04, AR-06, AR-07, AR-09, and release-candidate approval depend on it.

| Decision | Recommended baseline for the next release candidate | Required record |
| --- | --- | --- |
| Content release | Ship content only inside the signed app bundle. Defer remote packs until their operational value justifies signing, compatibility, activation, and rollback complexity. | Content publication boundary, version ownership, and rollback behavior. |
| Media availability | Bundle core text, search/museum indexes, cover media, posters, and fallbacks required for the launch journeys. Treat remote media as optional and disabled unless explicitly approved. | Offline matrix by media kind plus IPA, installed-size, and cache budgets. |
| Deep links/public web | Support in-app canonical routes for the next release candidate. Keep Vercel as a review preview unless Universal Links or a public companion are explicitly approved. | Supported URL schemes, external-link policy, and conditional web metadata scope. |
| Telemetry | Use an inspectable local build manifest and local-only diagnostics until a privacy review approves a constrained native/JavaScript event channel. | Allowed events and fields, consent, retention, transport, ownership, and disabled behavior. |

**Gate exit:** The documents use one unambiguous meaning for preview,
production, publish, rollback, offline, and public URL. Every affected existing
story marked “Done” is either amended with a remediation story or explicitly
superseded; historical status is not silently rewritten.

## 4. Delivery sequence

Each work package starts with a failing behavior or contract test, makes the
smallest implementation change, and removes obsolete behavior only after its
replacement passes. Keep the pull requests independently reviewable and the main
branch releasable.

### Milestone 1 — release-blocking correctness

#### WP-02 — deterministic static asset resolution (AR-02)

Deliver this first because it fixes a visible learner failure and establishes a
shared artifact-loading contract for later graph and museum indexes.

1. Add a small `StaticAssetResolver` boundary that resolves a logical artifact
   name from an explicit application asset base. Do not infer the base from the
   current pathname.
2. Provide delivery adapters for:
   - root and nested routes on the local/static web preview;
   - `applocal://localhost/` in the bundled iOS runtime;
   - a configured base path if a hosted preview later uses one.
3. Change museum search to load the index through the resolver.
4. Reject non-2xx responses, malformed JSON, and contract-version mismatches.
   Let these failures reach `MuseumSheet` so its accessible
   “搜索暂时不可用” state is shown; do not cache a failure as an empty index.
5. Add one retry path that clears the rejected cached promise without requiring
   an app restart.

Tests and evidence:

- unit tests for URL resolution and failed-response behavior;
- component tests distinguishing no results from unavailable search;
- static-host integration checks from `/`, `/museum/`, and one subject route;
- iOS simulator check through `applocal://localhost/`, including offline mode
  and a deliberately missing index;
- keyboard and screen-reader announcement verification for loading and error
  states.

**Exit:** Search returns the same known fixture from every supported route and
the packaged app; a transport or parse failure cannot appear as zero matches.

#### WP-01 — exhaustive content references (AR-01)

1. Add one pure reference-contract module that collects every reference as:
   source entity ID, field path, expected target type or allowed type set, and
   reverse-link rule where applicable.
2. Cover common and nested fields in addition to existing entity relationships:
   - entity `sourceIds` and `coverMediaId`;
   - block `sourceIds`, `mediaId`, `mediaIds`, and
     `relatedEntities.entityIds`;
   - media `posterMediaId` and `fallbackMediaId`;
   - every typed season, race, standing, participant, technology, era, and
     source relationship.
3. Use the collector from graph validation and, later, graph compilation.
   Remove the private partial collector after parity tests pass.
4. Report file/entity ID, exact field path, expected type, referenced ID, and
   actual type when present.
5. Add all domain-required reverse invariants. Make each invariant explicit;
   do not infer that every relationship must be symmetrical.
6. Fix any invalid repository content exposed by the new validator in separate,
   reviewable content changes with source and rights metadata preserved.
7. Stop `ContentRepository` from treating invalid build-time references as
   optional. Learner-facing fallback remains only for post-build media or device
   failures.

Tests and evidence:

- table-driven fixture coverage for every reference family;
- missing-target and wrong-target-type tests for scalar, array, and nested
  fields;
- reverse-link tests in both directions where required;
- a generated-graph invariant asserting zero unresolved internal references;
- `npm run validate:content` against the complete 1950–2025 content tree.

**Exit:** A published typo cannot silently remove a source, cover, block media,
gallery item, or related link, and diagnostics meet AR-01 acceptance wording.

### Milestone 2 — iOS security and diagnostics boundary

This milestone starts after D0 and delivers AR-03 and AR-04 as one integrated
release-candidate increment, split into small native, web, and documentation
pull requests.

#### WP-03 — WebView security boundary (AR-03)

1. Define one reviewed origin and navigation policy shared by:
   - content/media validation;
   - `WKNavigationDelegate`;
   - a compiled `WKContentRuleList` for resource requests;
   - `WKURLSchemeHandler`;
   - hosted-preview CSP configuration, if that variant remains.
2. Permit only `applocal://localhost/` for in-app documents and approved remote
   media origins for resource loading. Treat `mailto`, `tel`, and `sms` as
   explicit external actions. Open approved external web links in the system
   browser rather than granting arbitrary in-WebView navigation.
3. Canonicalize and contain every scheme-handler path under `WebAssets`.
   Reject traversal, unexpected hosts, unsupported methods, and missing routes
   with an explicit safe error instead of silently serving the home page.
4. Keep JavaScript window opening disabled. Add no bridge unless D0 approves
   telemetry or another named native capability.
5. If a bridge is approved, register individual message names with versioned,
   allowlisted schemas; reject unknown fields, origins, oversized messages, and
   arbitrary native method names.
6. Document App Transport Security, custom-scheme behavior, external links,
   allowed remote resources, and the policy for cache/data-store persistence.
7. Add an `F1ChronicleTests` target and an `F1ChronicleUITests` target to the
   XcodeGen project so the generated project carries the security tests.

Tests and evidence:

- native unit tests for scheme, host, path, navigation type, and external-action
  policy matrices;
- path traversal and missing-file tests for `AppSchemeHandler`;
- UI tests proving an unapproved navigation cannot replace the local app;
- content-validation tests for approved and unapproved remote media;
- a simulator network log showing the offline launch makes no unexpected
  requests;
- CSP/header assertions for the hosted preview only if D0 retains it.

**Exit:** Unapproved document, script, media, and bridge activity fails closed
with non-personal diagnostics, while required offline media and external actions
still work.

#### WP-04 — static version and diagnostics contract (AR-04)

1. Generate a versioned `build-manifest.json` during the content build with:
   schema version, app version, content version, full build commit, build
   timestamp, content-pack ID, graph version, and media-manifest version.
2. Copy the exact manifest with the static assets and make the iOS app verify
   that the bundled manifest exists and is compatible before presenting the
   WebView.
3. Inject or load the same manifest into error reporting so reports never use
   fixed `"static"` versions.
4. Select the diagnostics sink from D0:
   - local-only: bounded unified logging plus an inspectable support screen or
     export path;
   - approved telemetry: a versioned, privacy-reviewed native bridge and
     allowlisted event schema.
5. Explicitly exclude search text, feedback drafts, personal identifiers,
   arbitrary URLs, and page content.
6. Remove `/api/diagnostics` from preview comments, deployment docs, operations
   docs, smoke tests, and completed-story notes. Link to the static manifest or
   approved native support path instead.

Tests and evidence:

- deterministic manifest-generation tests with an injected clock and versions;
- build test asserting the manifest exists in both `out/` and the iOS bundle;
- malformed/missing/incompatible manifest tests;
- renderer and route error tests asserting real version fields and schema
  allowlisting;
- repository search proving no release document advertises
  `/api/diagnostics`.

**Exit:** Support can identify the exact app/content package without a runtime
API, and the documented error path matches shipped behavior.

### Milestone 3 — one content graph and one release artifact

#### WP-05A — compile a single normalized graph (first half of AR-05)

1. Define and version the generated graph contract before changing consumers.
2. Add `tools/content/build-graph.mjs` as the single entry point for migration,
   schema validation, reference validation, draft/publication policy, reverse
   relationships, route payloads, timeline index, museum index, search index,
   media manifest, and build manifest inputs.
3. Honor `CONTENT_ROOT` and an explicit build variant; remove hard-coded content
   roots from generators.
4. Write artifacts to one ignored/generated directory and publish only the
   artifacts required at runtime into `public/`/`out/`.
5. Make `npm run build` invoke the graph compiler before `next build`, so a
   direct production build cannot bypass validation.

**Exit:** Invalid content prevents `npm run build`, and all generated indexes
share one graph version and relationship implementation.

#### WP-05B — migrate application consumers (second half of AR-05)

1. Add a generated-artifact repository adapter behind the existing
   `ContentRepository` query contract.
2. Run contract tests against the current file adapter and new generated
   adapter, then compare representative outputs for timeline, season, museum,
   search, and subject queries.
3. Migrate routes one family at a time. Ensure each route receives only its
   compact payload.
4. Move `build-search-index.mjs` behavior into the graph compiler and delete the
   duplicated raw parser after parity is proven.
5. Remove runtime raw-content parsing after all routes use generated artifacts.

**Exit:** No application route or independent generator parses source documents
directly, and a future adapter can feed the same normalized compiler contract.

#### WP-06 — signed content release and rollback (AR-06)

Implement the D0-selected model:

- **Bundled-only baseline:** bind the build manifest, graph, media manifest, and
  WebAssets hash to the app version/build number; archive the reports with the
  signed build; document App Store/TestFlight promotion and restoration to the
  last approved build.
- **Remote packs, only if approved:** additionally require signature and hash
  verification, schema/app compatibility, staging outside the active directory,
  atomic activation, last-known-good retention, bounded storage, and tested
  rollback after interrupted/corrupt/incompatible updates.

Separate workflows and vocabulary for Vercel review previews and signed iOS
production. Replace destructive ad hoc asset copying with a staged sync that
verifies the complete artifact before replacing the destination.

**Exit:** A release record identifies exactly one app, graph, media manifest,
and content package; a failed update or build leaves the last valid learner
experience available.

### Milestone 4 — iOS package and museum performance

#### WP-07 — media pipeline and iOS budgets (AR-07)

1. Record IPA download, installed-size, WebAssets, launch working-set, and
   offline-media budgets from D0.
2. Generate responsive AVIF/WebP renditions during ingestion with dimensions,
   MIME type, byte count, content hash, and fallback metadata.
3. Validate required rendition widths and per-screen/above-fold budgets.
4. Package only media selected by the offline policy; retain posters and text
   when optional rich media is remote.
5. Emit total and delta reports by app code, graph, image, audio/video, and 3D.
6. Measure cold launch, museum first-open, route interaction, layout shift,
   memory, and thermal behavior on the lowest supported iPhone and a current
   device.

**Exit:** CI blocks unexplained budget regressions, representative routes choose
appropriate renditions, and core history remains available when rich media is
absent.

#### WP-08 — lazy museum catalogue (AR-08)

1. Emit a compact museum catalogue from the graph compiler.
2. Remove car/person/technology arrays from the home page props and initial
   HTML.
3. Load and cache the catalogue through `StaticAssetResolver` only when the
   museum opens; share it with search where practical without merging unrelated
   contracts.
4. Add loading, retry, unavailable, and empty states. Preserve tab and scroll
   restoration.
5. Prepackage the index when the D0 offline policy requires offline museum use.

**Exit:** Home HTML contains timeline and launcher data only; first museum open
meets the device interaction budget and remains accessible offline.

### Milestone 5 — route and quality hardening

#### WP-09 — durable routes and conditional public metadata (AR-09)

- Compile `redirectFrom` into a route-migration map used by the iOS navigator.
- Add Universal Link mappings and hosted static redirects only if D0 approves
  them.
- Generate canonical/social metadata, structured data, sitemap, and robots
  policy only for an approved public web companion; do not ship preview URLs as
  canonical production URLs.
- Test renamed entities, redirect loops/collisions, and unknown routes.

#### WP-10 — deterministic accessibility checks (AR-10)

- Reproduce the default-suite timeout in CI conditions and measure which setup,
  render, or axe phase consumes the budget.
- Prefer a focused home fixture or route-family browser audit; otherwise set a
  named route-specific timeout with evidence.
- Add retry/flakiness tracking only as measurement, never as a green result.

#### WP-11 — one runtime schema/type source (AR-11)

- Record the schema-library and generated-JSON-Schema decision.
- Introduce discriminated schemas one family at a time and infer TypeScript
  types from them.
- Run old/new validator parity fixtures during migration; remove each old
  validator and broad `unknown` projection only after its consumers migrate.
- Preserve schema versions and explicit migrations.

#### WP-12 — locale and URL state (AR-12)

- Define locale resolution and Chinese fallback before adding more prose.
- Centralize UI messages outside components and add locale-aware metadata.
- Keep entity IDs stable across locales.
- Add URL-backed museum filters only with the scheduled P2 filtering story;
  preserve current navigation/session state until then.

#### WP-13 — pre-release audits (AR-13)

- Run static-package performance, size delta, asset health, rights expiry,
  accessibility smoke, and iOS simulator/device smoke checks before promotion,
  not only after a push to `main`.
- Upload immutable reports keyed by app/content/build-manifest versions.
- Require a named, expiring exception with owner and target release for any
  budget miss.
- Keep post-release smoke checks as confirmation, not as the first release gate.

## 5. Traceability to existing requirements

| Review item | Existing requirements and stories affected |
| --- | --- |
| AR-01 | PRD CO-02, CO-03, CO-06, DE-07; US-B01.6, US-B04 |
| AR-02 | PRD MU-05, SE-03; US-E02, US-H01.4 |
| AR-03 | PRD security/privacy; Architecture §16; US-B03, US-H03.2 |
| AR-04 | US-A02, US-H03.1, US-H03.2, US-H03.7 |
| AR-05 | Architecture ADR-004 and §9; US-B04 |
| AR-06 | PRD CO-05; US-A02, US-H03.3, US-H03.8 |
| AR-07 | PRD performance/media budgets; US-F01, US-H02 |
| AR-08 | PRD MU-01, MU-05; US-E01, US-E02, US-H02 |
| AR-09 | PRD TL-06, LO-03, LO-04; US-C03, US-B04 |
| AR-10 | US-H01 and the no-red-CI engineering rule |
| AR-11 | US-B01, US-B04; Architecture schema recommendation |
| AR-12 | PRD LO-01, LO-02; US-E02 |
| AR-13 | US-H02, US-H03.3 through US-H03.8 |

New remediation work should reference both its `AR-xx` identifier and the
affected story. A “Done” story with contradicted acceptance evidence is not used
as proof that the review item is complete.

## 6. Verification matrix

The following evidence is required in addition to focused tests for each work
package:

| Change type | Required verification |
| --- | --- |
| Domain/compiler | Unit and contract tests, negative fixtures, complete `validate:content`, generated-artifact determinism and zero unresolved references |
| Web behavior | Component tests, route integration tests, automated accessibility, static-host smoke from root and nested routes |
| iOS boundary | Swift unit tests, simulator UI tests, offline launch, blocked-origin/path tests, supported-device smoke |
| Media/performance | Production build, WebAssets/IPA size report, representative route audit, low-end-device evidence, fallback verification |
| Release/operations | Manifest/integrity verification, failed-build protection, rollback exercise, immutable evidence artifact |
| Documentation | Link and command checks plus repository search for obsolete contracts such as `/api/diagnostics` and Vercel-as-iOS-production wording |

For every merge candidate run, as applicable:

```sh
npm run format
npm run lint
npm run typecheck
npm run test
npm run validate:content
npm run build
npm run perf:routes
npm run ops:check-assets
npm run ops:rights-report
```

Add a repository command for Xcode unit/UI tests once the test targets exist and
run it in the release workflow. Device-only checks must record the model, OS,
build-manifest version, result, and evidence location.

## 7. Rollout and rollback strategy

- Introduce the asset resolver before moving additional artifacts behind it.
- Dual-run old and generated repository adapters in contract tests, not in
  learner runtime. Cut over route families incrementally and delete the old raw
  path after parity.
- Stage and verify WebAssets before replacing the iOS bundle directory.
- Make navigation and resource policy fail closed; retain a local diagnostic
  path for blocked requests.
- Do not enable remote content packs or telemetry behind an undocumented
  production flag. They require D0 approval and their own rollback/disable path.
- Preserve the last approved signed app/content artifact and rehearse the
  selected restoration procedure before release-candidate approval.

## 8. Ownership and review

| Responsibility | Accountable role |
| --- | --- |
| Product decisions, offline scope, public URL, telemetry approval | Product owner |
| ADRs, graph/release contracts, security acceptance | Engineering lead |
| Content references, graph compiler, web artifact consumers | Domain/web engineer |
| Scheme handler, WebView policy, signing, simulator/device tests | iOS engineer |
| Accessibility, performance, rollback, and evidence audit | QA with engineering |
| Source, rights, and content corrections exposed by validation | Content reviewer and product owner |

## 9. Completion criteria

The architecture review can be closed only when:

1. D0 decisions are recorded and the source-of-truth documents no longer
   conflict.
2. Every AR item links to merged code/docs and focused regression evidence.
3. AR-01 through AR-04 pass the next iOS release-candidate gate.
4. AR-05 through AR-09 meet their acceptance criteria in the next architecture
   increment or have an approved, owned release exception.
5. AR-10 through AR-13 are complete in their scheduled roadmap phase, with no
   flaky red CI normalized in the interim.
6. `npm run ci`, applicable release audits, iOS automated tests, and the
   simulator/device smoke matrix pass against the exact signed build manifest.
7. Rollback or last-known-good behavior is demonstrated for the selected
   release model.
