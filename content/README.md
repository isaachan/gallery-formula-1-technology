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
