# AI Contributor Instructions

These instructions apply to every AI agent working in this repository.

## Read first

Use these files as the source of truth instead of repeating their rules here:

- `docs/PRD.md`: product scope, requirements, and launch acceptance criteria.
- `docs/ARCHITECTURE.md`: technical decisions, domain model, content/media contracts, and system boundaries.
- `docs/DEVELOPMENT_PLAN.md`: user stories, delivery order, research workflow, and Definition of Done.
- `docs/ENGINEERING_DISCIPLINE.md`: Agile, TDD, SOLID, quality, review, and operational practices.
- `design/README.md`, prototype, and screenshots: intended appearance and interaction; the prototype is not production code.

Read the documents relevant to the task before planning or editing. Do not silently override them. If they conflict or the user requests a material change to an established decision, identify the conflict and confirm the new direction before irreversible work.

## Non-negotiable context

- Content is Chinese-first; English currently covers names and subtitles.
- Populate every season from 1950 through the agreed publication boundary.
- Developers maintain repository-based content. Do not build a separate CMS unless explicitly requested.
- Historical content is researched from reviewable web sources and written into the repository as original prose.
- The product owner decides final licensing; engineering preserves required source, attribution, rights-review, accessibility, and fallback metadata.
- Approved merges publish immediately, so the main branch must remain releasable.

## Agent workflow

1. Map the request to the relevant user story, acceptance criteria, and architecture boundary.
2. Inspect existing code and content before proposing or changing anything.
3. Deliver the smallest complete vertical increment; avoid unrelated refactors and speculative infrastructure.
4. Follow red-green-refactor for behavior and regression fixes where feasible.
5. Keep domain content out of UI code and preserve the repository, typed-block, media-registry, and stable-ID boundaries defined in the architecture.
6. When researching history, follow the source hierarchy and verification workflow in the development plan; never guess, silently resolve conflicts, or copy source prose.
7. Run all checks applicable to the change, including content/schema validation and accessibility, visual, performance, or media checks when affected.
8. Before finishing, apply the Definition of Done and report changes, verification, unresolved risks, and checks that could not run.

Keep changes small, reviewable, accessible, secure, and deployable. Prefer clear domain language and simple designs justified by current requirements.
