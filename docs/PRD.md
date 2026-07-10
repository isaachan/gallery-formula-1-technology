# F1 Track Chronicle - Product Requirements Document

## 1. Document purpose

This document defines the product requirements for a mobile-first web application for learning Formula 1 history, notable people, cars, and technology. It is based on the interactive design prototype in `design/`.

The product is an editorial learning experience, not a live timing or racing statistics application. Its central idea is a chronological track from 1950 to the present. Seasons form the narrative spine; cars, people, and technologies form a cross-linked museum that lets learners explore a topic and return to its historical context.

## 2. Product vision

Make more than 75 years of Formula 1 understandable and enjoyable by turning its chronology into a playful journey and connecting every important person, machine, and invention to the seasons in which it mattered.

### Product principles

1. **Chronology first:** every subject should be understandable in its historical context.
2. **Explore in either direction:** learners can move from a season to a person, car, or technology, and from any museum entry back to the timeline.
3. **Show, then explain:** use photography, diagrams, animation, audio, and 3D where they improve understanding; do not use rich media only as decoration.
4. **Progressive depth:** short summaries serve casual visitors, while specifications, race results, and technical explanations reward deeper exploration.
5. **Editorial trust:** facts have sources, review status, and revision history.
6. **Mobile by default:** the primary experience is designed for touch and a narrow viewport, while remaining accessible and useful on desktop.

## 3. Goals and non-goals

### Goals

- Cover every F1 season from 1950 onward on a continuous, navigable timeline.
- Teach the relationships among seasons, drivers, cars, teams, races, and technologies.
- Provide memorable, media-rich detail pages for important subjects.
- Allow content maintainers to update copy, add photographs, and replace media formats without application code changes for normal editorial work.
- Support Chinese-first, English-assisted content at launch and make full localization possible later.
- Load quickly on mobile networks and degrade gracefully when 3D, audio, or remote data is unavailable.
- Establish a traceable content workflow with validation, preview, review, and rollback.

### Non-goals for the first release

- Live timing, current-race telemetry, fantasy leagues, or betting features.
- User accounts, comments, or community-contributed content.
- A general-purpose page builder.
- Complete simulation-grade car or engine models.
- Replacing an authoritative statistics provider with manually maintained race results.
- Native iOS or Android applications.

## 4. Audience and primary jobs

### Curious newcomer

- Understand how F1 changed across decades.
- Learn why a famous season, driver, car, or invention matters.
- Explore without needing prior knowledge of racing terminology.

### Enthusiast

- Revisit seasons and compare entrants, results, and technical changes.
- Follow connections among teams, drivers, cars, and innovations.
- Inspect high-quality photographs, diagrams, and 3D models.

### Educator or parent

- Use focused stories and visual explanations to introduce engineering and history.
- Share a stable link to a specific season or subject.

### Content editor

- Correct a sentence or translation without changing UI code.
- Add or replace a photograph and its attribution.
- upgrade a technology illustration from an image to animation or 3D.
- Preview changes, validate links and metadata, and publish with a reviewable diff.

## 5. Information architecture

### Primary areas

| Area | Purpose | Primary content |
| --- | --- | --- |
| Track timeline | Chronological discovery | All seasons, decade themes, highlighted seasons |
| Season detail | Historical context and season overview | Champion, cars, races, standings, technologies |
| Museum | Topic-led discovery | Cars, technologies, people |
| Subject detail | Focused learning | Story, facts, media, relationships, timeline links |

### Core entities and relationships

- A **season** has races, standings, entrants, a champion, featured cars, and featured technologies.
- A **person** can drive for multiple teams, participate in many seasons, and be associated with cars and notable events.
- A **car** belongs to a constructor and season, has drivers and an engine, and can feature multiple technologies.
- A **technology** can appear in multiple cars and seasons and can have one or more learning presentations.
- A **team**, **race**, and **circuit** provide normalized reference data used by the primary subjects.
- Every editorial claim may include one or more **sources**.

## 6. Core user journeys

### Journey A: explore history on the track

1. The learner opens the timeline at the start or at a deep-linked year.
2. They scroll along the track; the car position, decade selector, and nearby cards respond to progress.
3. Selecting an ordinary year opens a concise summary; selecting a highlighted year opens its detail page.
4. The learner moves to adjacent seasons or follows a related car, person, or technology.

### Journey B: learn through the museum

1. The learner opens the museum and chooses Cars, Technology, or People.
2. They browse or search the collection and open an entry.
3. The detail view presents a story, structured facts, and the most suitable media.
4. A timeline action takes them to the entry's representative or first-use season.

### Journey C: understand a technical concept

1. The learner opens a technology from a season or museum entry.
2. A visual presentation explains the concept using an article, diagram, animation, video, audio, or 3D model.
3. Captions, accessible alternatives, and a plain-language explanation remain available regardless of presentation type.
4. Related cars and seasons show how the technology affected competition.

### Journey D: maintain content

1. An editor changes a typed content record or uses the future CMS form.
2. Automated validation checks required fields, relations, dates, translations, media metadata, and broken links.
3. A preview build shows the exact affected pages at mobile and desktop sizes.
4. A reviewer approves and merges or publishes the change.
5. The site rebuilds only affected content where supported; the prior version remains recoverable.

## 7. Functional requirements

Priorities use **P0** for launch-critical, **P1** for the next useful increment, and **P2** for later enhancement.

### 7.1 Timeline

| ID | Requirement | Priority |
| --- | --- | --- |
| TL-01 | Display every season from 1950 through the latest published season on a continuous track. | P0 |
| TL-02 | Provide a sticky decade selector that updates with scroll position and can jump to a decade. | P0 |
| TL-03 | Animate a small car along the track and reveal nearby season cards without blocking scrolling. | P0 |
| TL-04 | Distinguish editorially highlighted seasons from ordinary seasons. | P0 |
| TL-05 | Open an ordinary season summary in context and a highlighted season as a full detail view. | P0 |
| TL-06 | Support a stable URL for a season and restore the relevant timeline position on return. | P0 |
| TL-07 | Provide a reduced-motion presentation that removes continuous movement while preserving navigation. | P0 |
| TL-08 | Support filtering or highlighting by driver, team, or technology. | P2 |

### 7.2 Season detail

| ID | Requirement | Priority |
| --- | --- | --- |
| SE-01 | Show season identity, champion, championship car, and decade context. | P0 |
| SE-02 | Show participating cars, race winners, driver standings, and featured technologies when data is available. | P0 |
| SE-03 | Clearly label incomplete sections instead of inventing or silently omitting data. | P0 |
| SE-04 | Let users open related car, person, and technology detail views. | P0 |
| SE-05 | Provide previous and next season navigation. | P0 |
| SE-06 | Offer engine audio only after explicit user interaction and provide stop/mute controls. | P1 |
| SE-07 | Lazily load long race lists and rich media. | P0 |

### 7.3 Museum and discovery

| ID | Requirement | Priority |
| --- | --- | --- |
| MU-01 | Provide Cars, Technology, and People collections. | P0 |
| MU-02 | Open the same canonical detail page whether an entry is reached from a season or the museum. | P0 |
| MU-03 | Provide a direct action from each entry to a representative season on the timeline. | P0 |
| MU-04 | Preserve the user's museum tab and scroll state when returning from a detail page. | P1 |
| MU-05 | Search across names, aliases, teams, years, and technology terms. | P1 |
| MU-06 | Filter collections by decade, team, nationality, and media availability where applicable. | P2 |

### 7.4 Subject detail and rich media

| ID | Requirement | Priority |
| --- | --- | --- |
| DE-01 | Render structured facts and an editorial story for every car, person, and technology. | P0 |
| DE-02 | Compose the story from approved block types such as rich text, image, gallery, fact grid, quote, diagram, animation, audio, video, and 3D model. | P0 |
| DE-03 | Let editors reorder blocks or replace one media block type with another without changing route or page code. | P0 |
| DE-04 | Support multiple media assets and choose responsive variants based on viewport and device capability. | P0 |
| DE-05 | Show loading progress, fallback poster, caption, credit, and accessible alternative for rich media. | P0 |
| DE-06 | Provide touch, pointer, and keyboard controls for interactive 3D; never require 3D to access the explanation. | P0 |
| DE-07 | Link cars, people, technologies, teams, and seasons bidirectionally. | P0 |
| DE-08 | Support narrated text with explicit play/stop controls. Browser text-to-speech may be a fallback, not the sole narration source. | P1 |

### 7.5 Content operations

| ID | Requirement | Priority |
| --- | --- | --- |
| CO-01 | Store editorial content outside React components and presentation templates. | P0 |
| CO-02 | Validate content against versioned schemas during local development and CI. | P0 |
| CO-03 | Require stable IDs/slugs; relationships reference IDs rather than copying display names. | P0 |
| CO-04 | Store source, rights, credit, alt text, caption, focal point, and fallback information with media. | P0 |
| CO-05 | Provide preview builds and reviewable version history for content changes. | P0 |
| CO-06 | Detect broken relationships, duplicate IDs, missing assets, and invalid 3D metadata before publish. | P0 |
| CO-07 | Allow draft and published status plus an optional publish date. | P1 |
| CO-08 | Support importing external statistics into normalized records without overwriting editorial narratives. | P1 |
| CO-09 | Provide an editor-friendly CMS UI without changing the public rendering contract. | P2 |

### 7.6 Localization and sharing

| ID | Requirement | Priority |
| --- | --- | --- |
| LO-01 | Support Chinese primary copy and English names/subtitles in launch content. | P0 |
| LO-02 | Keep UI strings separate from content and support locale fallbacks. | P0 |
| LO-03 | Provide canonical, shareable URLs for every published entity. | P0 |
| LO-04 | Generate title, description, and social preview metadata per entity. | P1 |

## 8. Content model requirements

Each primary entity must include:

- stable `id`, URL `slug`, entity `type`, lifecycle `status`, and schema version;
- localized title, short summary, and optional long-form content blocks;
- typed relationships to other entities;
- representative season or date range;
- cover media plus optional media blocks;
- sources and editorial metadata (`author`, `reviewer`, `updatedAt`);
- SEO/share metadata with sensible generated defaults.

Content blocks must use a discriminated `type` and a stable block ID. New block renderers may be added by developers, but editors can instantiate and reorder existing block types freely. Unknown block types must fail validation during publishing and render a safe fallback in preview.

## 9. Data quality and editorial policy

- Championship results and race facts must come from a named, reproducible source.
- Editorial claims should cite a primary source or a reputable secondary source.
- Imported facts and authored narrative are stored separately so a refresh cannot erase editorial work.
- Dates, units, driver names, constructor names, and aliases use normalized formats.
- Media cannot publish without rights status, attribution where required, and alternative text or a documented decorative exemption.
- Corrections update `updatedAt` and retain version history.
- Machine-generated summaries, translations, or alt text require human review before publication.

## 10. Experience and visual requirements

- Reproduce the design's warm Japanese-inspired visual language, pastel era palette, solid offset shadows, rounded cards, and playful car illustrations.
- Use the 390 px mobile design as the baseline, then adapt rather than simply scale it for tablet and desktop.
- On wide screens, constrain reading width while using available space for timeline context or media.
- Preserve the era color system as a semantic token, not hard-coded per component.
- Keep minimum touch targets at 44 by 44 CSS pixels.
- Avoid layout shifts when images, fonts, or 3D assets load.
- Maintain visible focus, logical focus order, semantic headings, and sufficient color contrast.

## 11. Non-functional requirements

### Performance budgets

- Initial route JavaScript: target <= 200 KB compressed, excluding an on-demand 3D viewer chunk.
- Initial above-the-fold images: target <= 500 KB total on mobile.
- 3D viewer and model assets load only when requested or near the viewport.
- Typical glTF model: target <= 5 MB compressed; warn during validation above 8 MB and require explicit approval above 15 MB.
- Meet Core Web Vitals targets at the 75th percentile: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 on representative mobile traffic.

### Accessibility

- Target WCAG 2.2 AA.
- Support keyboard navigation, screen readers, zoom to 200%, reduced motion, and captions/transcripts for time-based media.
- Provide a static poster and textual explanation for every interactive visualization or 3D model.
- Audio never autoplays.

### Reliability and compatibility

- The timeline and textual content remain usable if JavaScript-enhanced media fails.
- Support the latest two major versions of Chrome, Safari, Firefox, and Edge; support current iOS Safari and Android Chrome.
- A failed external statistics refresh must not unpublish the last valid site build.

### Security and privacy

- Sanitize authored rich text and disallow arbitrary scripts in content.
- Restrict media to approved origins at build or ingestion time.
- Collect no personal data at launch beyond privacy-preserving aggregate analytics.
- Apply a restrictive Content Security Policy; interactive content is implemented through registered components, never arbitrary embedded HTML.

## 12. Analytics and success measures

### Product events

- timeline decade jump and season open;
- museum open, tab change, search, and result open;
- relationship link followed;
- media type loaded, played, interacted with, failed, or fell back;
- narration played or stopped;
- timeline return from a subject page;
- share action.

### Success measures for the first 90 days

- At least 50% of engaged sessions open two or more entity types.
- At least 30% of subject-detail sessions follow a relationship or return-to-timeline link.
- 95% of published pages have complete attribution, alt text, and source metadata.
- Fewer than 1% of rich-media loads end in an unhandled error.
- A trained editor can change copy or add a photograph in under 10 minutes, and can replace an image with an existing 3D asset configuration in under 20 minutes, excluding asset production and review.

## 13. Release plan

### Phase 1: editorial foundation and faithful core

- Timeline for all seasons with highlighted-season treatment.
- Complete 1988 reference season and representative museum collection.
- Canonical car, person, and technology detail pages.
- Typed local content, media registry, validation, preview, and source metadata.
- Article, image/gallery, diagram, and 3D block renderers with fallbacks.
- Responsive, accessible implementation of the supplied design.

### Phase 2: breadth and discovery

- Import full race and standings data for all seasons.
- Museum search and common filters.
- More authored season stories and media.
- Recorded narration and improved share metadata.

### Phase 3: editorial scale

- Headless CMS adapter using the same domain schemas.
- Draft previews, roles, scheduled publishing, and asset workflow.
- Additional interactive explainers and optimized 3D models.
- Optional personalization such as bookmarks, only after privacy review.

## 14. Acceptance criteria for launch

- All seasons from 1950 to the latest published season are navigable and deep-linkable.
- The 1988 season matches the prototype's full information structure.
- Cars, people, and technologies use canonical entity records and resolve all declared relationships.
- An editor can modify text, add a credited photograph, and change a technology's primary presentation from image to 3D using content-only changes.
- CI rejects invalid content, broken internal links, missing required media metadata, and unsupported block types.
- Every rich-media experience has a tested loading, error, reduced-motion, and accessible fallback state.
- Automated tests cover primary navigation and content rendering; visual checks cover the eight supplied reference screens at mobile size.
- Performance and accessibility budgets in this document are met on representative production builds.

## 15. Open product decisions

- Which statistics provider and license will be used for complete historical race data?
- Who owns editorial approval and factual corrections?
- Which languages beyond Chinese and English are planned, and when?
- Which media rights budget and archive partnerships are available?
- Is offline/PWA support valuable enough to prioritize after launch?

