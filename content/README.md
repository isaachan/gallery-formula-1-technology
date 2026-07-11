This directory will store repository-managed editorial content and media manifests.

The current validation baseline expects these top-level entity folders:

- `cars/`
- `circuits/`
- `eras/`
- `media/`
- `people/`
- `races/`
- `seasons/`
- `sources/`
- `standings/`
- `teams/`
- `technologies/`

## Scaffolding a new entity

Run `npm run content:new <type> <slug>` to generate a schema-valid draft
document in the right folder, for example:

```sh
npm run content:new season 1988
npm run content:new person ayrton-senna
```

The scaffold fills every required field with an obvious `-todo` placeholder
(for relationships you haven't created yet) or a `待补充` placeholder (for
text you still need to write). It never overwrites an existing file. Run
`npm run validate:content` afterward — it reports each placeholder as an
actionable "references missing target id" or "must be a non-empty Chinese
string" error, which doubles as your checklist of what to fill in next.
Documents are created with `"status": "draft"`, so drafts stay out of the
production build until you set `status` to `"published"`.

## Editing text

Edit the entity's `title`/`summary` (and any `richText` blocks in `blocks`)
directly — every localized field is a `{ zh, en? }` object, with `zh`
required and `en` optional. See [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
for the full content-block union.

## Adding an image

1. Scaffold a media asset: `npm run content:new mediaAsset engine-cutaway`.
2. Set its `src`/`variants` to a real file under `public/` (or an origin
   listed in `CONTENT_MEDIA_ALLOWED_ORIGINS`), fill in `alt` and `rights`,
   and add `caption`/`credit`/`focalPoint` as needed.
3. Reference it from an entity's `blocks` array with
   `{ "id": "...", "type": "image", "mediaId": "media-engine-cutaway" }`.

## Replacing an image with a 3D model

Change only the block's `type` and its media reference — the surrounding
entity, route, and page template do not change:

```diff
 {
   "id": "primary-visual",
-  "type": "image",
-  "mediaId": "media-engine-cutaway"
+  "type": "model3d",
+  "mediaId": "media-engine-model-v1"
 }
```

The new `model3d`-kind media asset needs its own `posterMediaId` and `model`
block (format/draco/ktx2/scale) — see the worked example in
[`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#8-example-content-change).

## Season research packet checklist

Use this checklist when researching and authoring a new season (per
US-G02/US-G03). `content/seasons/season-1988.json` and its linked
entities are a worked real-content example — copy its shape, not its facts.

1. **Champion + champion car** — `championPersonId`/`championCarId`, both
   resolving to real `person`/`car` records.
2. **Every championship race** — one `race` document per round, each with a
   real `circuitId` (create the `circuit` if it doesn't exist yet), date,
   and `winnerPersonId`/`winnerCarId` where known.
3. **Standings** — at least a `driver` standing; add a `constructor`
   standing if that championship existed that year. Set
   `defaultVisibleCount: 3` for the Top-3-by-default presentation. If you
   scope the stored grid to fewer than the full field (as US-G02A did, for
   time), say so in the season's `summary` and in the delivery-status entry
   — don't imply a truncated list is complete.
4. **Entrants/cars** — `entrantCarIds` on the season; each needs a real
   `constructorId`, `driverIds`, `technologyIds`, `engine`, and
   `specifications`. Scoping this to fewer than every constructor's car is
   fine (see US-G02A) as long as it's disclosed.
5. **At least one technology or regulation topic**, ideally demonstrating
   more than one presentation type (article/image, diagram or animation,
   3D-with-fallback) across the season's featured technologies.
6. **A Chinese editorial summary** — both the season's own `summary` and at
   least one `richText` block telling the season's story in original prose
   (never copied from a source).
7. **Sources** — every non-obvious factual claim should trace to a real,
   accessed `source` document (`sourceType`, `url`, `accessedOn`,
   `supportedClaims`). Cross-check consequential or disputed claims (win
   counts, championship results, technical specs) against a second
   reputable source before trusting a single page's summary — an
   AI-summarized fetch of one page can silently transpose facts.
8. **Record what you didn't populate.** If a championship year, a driver,
   or an entrant isn't backed by a real record yet, leave it out rather
   than guessing — the content graph will reject a reference to a
   nonexistent id, and that's the intended signal to come back later.
9. Run `npm run validate:content` and `npm run ci`, then spot-check the
   rendered season/subject pages in a browser before calling a season done.
