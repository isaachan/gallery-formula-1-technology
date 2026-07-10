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
- Every season from 1950 through the latest completed or editorially published season must be populated.

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

**Acceptance criteria:**

- Schemas exist for seasons, races, standings, cars, people, technologies, teams, eras, sources, and media assets.
- IDs are stable, slugs are unique, and relationships use IDs.
- Validation reports actionable file paths and field-level errors.
- CI detects duplicate IDs, broken references, invalid years, missing required localization, and unsupported schema versions.
- Schema migrations are versioned and tested.

#### US-B02 - Compose entity stories from typed blocks

**As a content-maintaining developer,** I want to assemble pages from approved content blocks so that presentation can evolve without page-specific code.

**Priority:** P0

**Acceptance criteria:**

- The initial registry supports rich text, image, gallery, fact grid, quote, diagram, animation, audio, video, 3D model, and related-entity blocks.
- Blocks have stable IDs and may be reordered in content.
- Unknown blocks fail publication validation and produce a safe diagnostic in development preview.
- Changing an existing image block to an existing 3D block requires content and asset-manifest changes only.

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

**Acceptance criteria:**

- Every published season from 1950 onward appears exactly once.
- The sticky decade selector reflects the nearest season and jumps to the chosen decade.
- Scrolling updates the decorative car and nearby-card emphasis without scroll jank.
- Highlighted and ordinary seasons use their specified treatments.
- The experience remains navigable with animation disabled.

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
- A second reviewer checks factual consistency before merge.

#### US-G03 - Populate every season

**As a learner,** I want every season represented with meaningful information so that the timeline is a complete historical journey.

**Priority:** P0

**Acceptance criteria:**

- All seasons from 1950 through the agreed publication boundary satisfy the minimum completeness contract.
- Automated coverage reports show no missing season, required field, broken relation, or missing source.
- Highlighted seasons receive the richer editorial treatment defined by the design.
- The 1988 season meets the full reference depth before the bulk template is accepted.
- Content may be merged in reviewed decade-sized batches while the launch gate requires complete coverage.

#### US-G04 - Record corrections transparently

**As a content reviewer,** I want corrections to be traceable so that historical trust is maintained.

**Priority:** P1

**Acceptance criteria:**

- Git history identifies the changed claim and reason.
- Material corrections update the entity's review metadata.
- Corrections deploy through the same automated validation and review path as other changes.

### Epic H: quality, accessibility, and operations

#### US-H01 - Use the application accessibly

**As a learner using assistive technology or alternative input,** I want equivalent access to navigation and content.

**Priority:** P0

**Acceptance criteria:**

- Target routes meet WCAG 2.2 AA in automated and manual review.
- Keyboard navigation, focus management, semantic structure, color contrast, zoom, and screen-reader labels are verified.
- Rich media has the alternatives required by the PRD and architecture.

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

**Acceptance criteria:**

- Route exceptions and media-renderer failures include application/content version and entity/asset ID.
- Publishing failures do not replace the last valid deployment.
- Alerts cover deployment failure, broken production assets, and media-rights expiry metadata when present.
- Analytics avoid collecting personal content or unnecessary identifiers.

## 8. Recommended delivery increments

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

## 9. Historical research workflow

For each season or subject:

1. Start with an explicit checklist of required facts and relationships.
2. Search broadly to identify terminology, aliases, controversies, and likely primary sources.
3. Prefer official Formula 1/FIA/constructor archives, contemporary records, books, museums, and reputable motorsport publications for important claims.
4. Use Wikipedia as a discovery aid and cross-check, following its citations where useful.
5. Record sources before drafting prose.
6. Write an original Chinese summary that separates fact from interpretation.
7. Normalize names, units, dates, teams, and relationships to repository entities.
8. Run automated validation and the season coverage report.
9. Have another reviewer compare the entry with its cited sources.
10. Merge only when factual questions are resolved or explicitly documented.

Web content can change. Source records therefore include an access date, and durable/archive links should be used where legally and operationally appropriate.

## 10. Backlog management rules

- Product value, risk, and dependency determine priority; effort alone does not.
- P0 stories must be split until they can produce an independently testable increment.
- Defects that compromise facts, accessibility, security, publishing, or data loss take precedence over new P1/P2 features.
- Architectural work should be attached to a user-visible or operational capability, except for explicitly approved risk-reduction spikes.
- A spike is time-boxed and ends with evidence, a decision, and follow-up backlog items rather than production code by default.
- Content debt is visible in the backlog and coverage report, not hidden in placeholders.
- Scope may change between iterations; an active iteration changes only with product-owner and team agreement.

## 11. Release checklist

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

## 12. Initial risks and mitigations

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

