# F1 Track Chronicle - Engineering Discipline

## 1. Purpose

This document defines how the team builds and evolves the product. It is a working agreement, not a ceremony checklist. The goal is a steady stream of small, reviewable, production-ready increments with high confidence in behavior and historical content.

When principles conflict, optimize in this order:

1. correctness, user safety, accessibility, and historical integrity;
2. clarity and simplicity;
3. fast feedback and incremental delivery;
4. performance and operational reliability;
5. extensibility justified by known needs.

## 2. Agile working principles

### Deliver working increments

- Build vertical slices that include content, UI, tests, accessibility, and deployment.
- Keep the main branch releasable.
- Demonstrate working software at the end of each iteration.
- Prefer measured user or operational outcomes over percentage-complete reporting.
- Release small changes frequently; avoid long-lived integration branches.

### Welcome learning and change

- Refine the backlog continuously as full-season content reveals new domain needs.
- Treat plans as forecasts, not commitments detached from evidence.
- Use time-boxed spikes for genuine uncertainty and record the resulting decision.
- Revisit architectural decisions when their assumptions change, documenting the trade-off.

### Collaborate directly

- Product, design, content, and engineering review vertical slices together.
- Raise uncertainty early and attach it to a concrete story or decision.
- Make acceptance criteria and quality expectations visible before implementation.
- Use retrospectives to select a small number of actionable process improvements and check their effect.

### Limit work in progress

- Finish, review, and integrate current stories before starting additional work.
- Keep pull requests small enough to review thoroughly.
- Make blocked work visible; swarm on launch-critical blockers.
- Do not count partially implemented layers as delivered value.

## 3. Test-driven development

Use TDD for domain rules, content transformations, queries, timeline calculations, importers, and behavior with meaningful branching.

The default loop is:

1. **Red:** express one observable behavior with a failing test.
2. **Green:** write the smallest implementation that satisfies it.
3. **Refactor:** improve names and structure while all tests remain green.

Discipline:

- Test behavior through stable public boundaries, not private implementation details.
- A bug fix starts with a failing regression test whenever technically feasible.
- Tests must be deterministic, isolated, and clear about why behavior matters.
- Prefer real domain objects and lightweight fakes over deep mocking.
- Mock only external boundaries such as network, clock, browser capability, or storage.
- Do not chase line-coverage targets as a substitute for risk-based tests.
- Use schema fixtures and contract tests to protect content and adapter boundaries.
- Keep the test pyramid broad at unit/contract level and selective at end-to-end level.

Exceptions, such as exploratory visual work, are acceptable when followed by characterization and interaction tests before the story is done.

## 4. Simple design

Choose the simplest design that:

- passes the tests;
- communicates intent;
- removes meaningful duplication;
- contains no speculative capability.

Practices:

- Implement today's accepted story, while preserving established extension points such as the block registry and content repository.
- Prefer explicit code and data over metaprogramming or configuration languages.
- Introduce an abstraction after its responsibility and variation are understood, not merely because two lines look similar.
- Avoid general-purpose page builders, plugin systems, event buses, global stores, and runtime services until a demonstrated need exists.
- Delete obsolete paths and feature flags after rollout is complete.
- Record significant trade-offs as short architecture decision records.

## 5. SOLID applied pragmatically

### Single Responsibility Principle

- Domain schemas describe valid content.
- Repositories load and normalize content.
- Queries select view data.
- Components render behavior and presentation.
- Media renderers handle one media capability.
- Importers translate external facts without authoring editorial prose.

A module should have one primary reason to change, expressed in domain language.

### Open/Closed Principle

- Add a registered content-block renderer to introduce a new presentation type.
- Do not add entity-name or season-specific conditionals to generic page templates.
- Extend schemas through explicit versioning and migrations.

### Liskov Substitution Principle

- File and future CMS repositories must pass the same contract suite.
- Media renderers must honor the shared loading, error, attribution, and accessibility contract.
- A fallback implementation must preserve essential information, even when it offers less interaction.

### Interface Segregation Principle

- Keep query and renderer interfaces narrow and consumer-oriented.
- Do not make timeline code depend on full subject documents when a timeline summary is sufficient.
- Separate authoring/import concerns from public read queries.

### Dependency Inversion Principle

- Features depend on domain contracts and `ContentRepository`, not YAML parsers, CMS SDKs, or storage vendors.
- UI code receives normalized view models, not provider response objects.
- Infrastructure dependencies are composed at application boundaries.

SOLID is a diagnostic tool, not a mandate to create an interface for every class or function.

## 6. Domain-driven boundaries

- Use the product's language consistently: season, race, standing, entrant, car, person, technology, team, era, source, and media asset.
- Stable entity IDs define identity; slugs and display names do not.
- Relationships are explicit and validated.
- Imported facts and editorial narrative remain separate models until the query/build layer combines them.
- Domain modules must not import UI or framework modules.
- Page-specific view models may combine domain data, but must not become a second source of truth.

## 7. Content engineering discipline

Historical content is production data and follows engineering-quality controls.

- Store every claim-bearing entry with reviewable source references.
- Prefer official archives, primary records, and reputable specialist sources for consequential claims.
- Wikipedia is acceptable for discovery and cross-checking; use an additional reputable source for important or disputed claims when available.
- Record source title, publisher/author when known, URL, access date, source type, and claim notes.
- Write original Chinese prose. Do not copy source passages except for brief, attributed quotations.
- Explicitly record uncertainty or source disagreement; never resolve it by guessing.
- Normalize units, dates, terminology, names, and aliases through shared conventions.
- Require another reviewer for new season packets and material historical claims whenever practical.
- Validate all cross-links, coverage requirements, and sources in CI.
- Treat content corrections as normal reviewed changes, not silent edits.

## 8. Localization discipline

- Chinese is the authoritative prose locale for the current release.
- English fields are required only where the schema identifies a name or subtitle.
- UI strings live outside components and do not mix with editorial content.
- Schemas use localized value types now so full English prose can be added later without replacing entity identity or relationships.
- Do not fabricate an English translation as a fallback for missing prose; apply the explicit locale fallback policy.
- Test long names and subtitles for layout resilience.

## 9. Media discipline

- Access media only through stable asset IDs and the media registry.
- Every meaningful asset has alternative text; every time-based asset has an equivalent description or transcript.
- Image, video, audio, and 3D assets declare rights-review status even when final legal review is owned by the product owner.
- Never ship unbounded original media directly to a page. Generate optimized variants and enforce budgets.
- Video and 3D require a poster; interactive media requires a non-interactive fallback.
- Rich media loads lazily and cannot block access to core historical content.
- Renderers own consistent loading, error, credit, keyboard, reduced-motion, and reduced-data behavior.
- Content may select allowlisted options but cannot execute arbitrary scripts or embed arbitrary HTML.

## 10. Code quality

### Readability

- Optimize code for the next developer reading it.
- Use domain names rather than abbreviations or framework jargon.
- Keep functions focused and make side effects visible at boundaries.
- Comments explain constraints, decisions, and non-obvious reasons, not syntax.
- Prefer immutable data transformations for the generated content graph.

### Duplication

- Remove duplication that can drift or expresses one domain rule in multiple places.
- Tolerate small local similarity until the correct shared concept is clear.
- Never duplicate canonical content or relationships to avoid writing a query.

### Errors

- Model expected absence and validation failure explicitly.
- Fail fast during authoring/build; degrade gracefully in the learner experience.
- Include entity ID, asset ID, content version, and actionable context in diagnostics.
- Do not swallow exceptions or silently omit invalid content.

### Dependencies

- Prefer platform and established project capabilities before adding a package.
- Document why a material dependency is needed and assess maintenance, license, bundle cost, and security posture.
- Pin versions through the lockfile and use automated dependency updates with CI.
- Remove unused dependencies promptly.

## 11. Component and frontend discipline

- Use semantic HTML before custom interaction semantics.
- Components receive normalized data and do not fetch content implicitly.
- Keep routing in real URLs and browser history; do not recreate routing in a global view-state object.
- Reserve stable dimensions for media, timeline nodes, and controls to prevent layout shift.
- Keep business/content rules out of CSS and presentation components.
- Use shared design tokens; avoid scattered literal colors and dimensions when a semantic token exists.
- Design loading, empty, error, offline, reduced-motion, and unsupported-capability states with the success state.
- Verify touch, pointer, keyboard, screen reader, zoom, narrow mobile, and wide desktop behavior.
- Progressive enhancement is required: text, sources, and links remain useful when rich client behavior fails.

## 12. Accessibility discipline

- WCAG 2.2 AA is a definition-of-done requirement, not a post-launch audit.
- Write acceptance tests for keyboard and focus behavior of new interactions.
- Run automated accessibility checks on each route family and manually verify what automation cannot assess.
- The timeline SVG and moving car are decorative; season navigation must use semantic links/buttons.
- Do not communicate information by color, animation, sound, or 3D alone.
- Audio never autoplays, animations can be paused where required, and reduced-motion preferences are honored.
- Maintain logical heading structure and focus placement after client navigation.

## 13. Performance discipline

- Treat performance budgets as tests with named owners.
- Measure production builds, not development mode.
- Do not send the entire content graph to every route.
- Split code by route and rich-media renderer.
- Lazy-load 3D, audio, video, and complex animation; prefetch only with evidence and respect reduced-data settings.
- Optimize images and models during ingestion/build rather than at runtime on the client.
- Investigate regressions using bundle and asset reports before raising budgets.
- Test representative low-end mobile hardware or an agreed approximation, not only developer laptops.

## 14. Security and privacy discipline

- Treat repository content, external web research, media files, and imported datasets as untrusted inputs.
- Validate and sanitize at ingestion/build boundaries.
- Disallow arbitrary content scripts, arbitrary JSX imports, and unsafe remote embeds.
- Keep secrets server-side and out of repository content and browser bundles.
- Use least privilege for deployment, storage, and future authoring systems.
- Maintain a restrictive Content Security Policy and allowlisted media origins.
- Process complex media in isolated build infrastructure and enforce file/size/type limits.
- Collect only analytics required for stated product decisions; avoid personal identifiers and user-entered content.
- Fix critical security findings before release and track lower-severity accepted risk explicitly.

## 15. Git and review discipline

- Use short-lived branches and small, coherent commits.
- Keep generated artifacts out of review unless they are deliberately versioned.
- A pull request explains user value, approach, tests, content/source changes, risks, and preview instructions.
- At least one developer reviews code; historical packets receive content/source review as defined in the plan.
- Authors resolve feedback through code or a documented technical discussion, not merely acknowledgment.
- Required checks and branch protection cannot be bypassed for routine releases.
- Avoid mixing unrelated refactors with feature or content changes.
- Squash or preserve commits according to repository policy, but maintain traceability from deployment to pull request.

## 16. Continuous integration and delivery

Every pull request should run, as applicable:

- formatting and lint checks;
- TypeScript and schema type checks;
- content validation, relationship validation, and coverage reports;
- unit and contract tests;
- component/integration tests;
- selected end-to-end, accessibility, and visual regression tests;
- production build and bundle/media budget checks;
- dependency and security scanning;
- broken-link and route generation checks;
- preview deployment and smoke test.

After merge:

- deploy atomically;
- run production smoke tests on primary journeys;
- retain the last known-good build;
- surface failures immediately and roll back when user experience or data integrity is compromised.

Do not normalize red CI. A flaky test is a defect: fix, quarantine with an owner and deadline, or remove it if it provides no reliable signal.

## 17. Observability and operational discipline

- Logs and errors identify route family, entity/asset ID, and application/content version without exposing secrets or personal data.
- Monitor deployment outcomes, Core Web Vitals, route errors, asset failures, and rich-media fallback rates.
- Alerts must be actionable and have an owner; remove noisy alerts.
- Document rollback, incident triage, and content-correction procedures before launch.
- After a material incident, write a blameless review focused on system conditions and concrete prevention work.
- Feed production evidence back into backlog priority and acceptance criteria.

## 18. Refactoring and technical debt

- Refactor continuously in the red-green-refactor loop and around touched code.
- Keep behavior protected while changing structure.
- Make technical debt visible with impact, evidence, and a proposed next step.
- Prioritize debt that slows frequent delivery, threatens facts or publishing, harms accessibility/performance, or increases operational risk.
- Do not create speculative cleanup projects without an observable outcome.
- Before introducing a second path, decide whether to migrate, coexist temporarily behind a flag, or replace atomically.

## 19. Decision-making heuristics

When evaluating a design or implementation, ask:

1. What user or editorial problem does this solve now?
2. What is the smallest observable behavior we can test and deliver?
3. Which domain boundary owns the rule?
4. Can content or media change without editing generic page code?
5. Does the design remain understandable when the collection contains every season?
6. What happens when data, media, WebGL, or JavaScript fails?
7. Can another developer validate and reverse the change?
8. Are accessibility, performance, security, and sources part of the design rather than follow-up tasks?

## 20. Practices to avoid

- Big-design-up-front implementation that delays the first end-to-end slice.
- Building a separate CMS before repository editing proves insufficient.
- Page-specific conditionals for named cars, people, technologies, or seasons.
- Arbitrary HTML/JavaScript stored as content.
- Copying display names instead of referencing canonical IDs.
- Tests coupled to component internals or dominated by snapshots.
- Over-mocking domain behavior.
- Large pull requests that combine architecture, UI, bulk content, and unrelated cleanup.
- Uncited historical prose or copied source text.
- Publishing interactive media without static/text fallbacks.
- Silently increasing bundle, asset, or model budgets.
- Treating accessibility or factual review as a final hardening phase.

## 21. Team review cadence

- **Daily:** coordinate active work, blockers, and work-in-progress limits.
- **At story start:** confirm readiness, examples, tests, content/source needs, and edge cases.
- **During development:** pair on high-risk domain, accessibility, importer, or 3D work as useful.
- **At pull request:** review code, tests, preview, content sources, and operational effect.
- **Each iteration:** demonstrate the integrated increment and adapt the backlog.
- **Retrospective:** choose one or two measurable improvements and follow through.
- **Periodically:** review architecture decisions, dependency health, performance trends, source coverage, and technical debt using evidence.

