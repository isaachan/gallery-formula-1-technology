# Deployment and Release

## Delivery boundaries

This repository has two deliberately separate delivery surfaces:

- **Hosted review preview:** an immutable Vercel build used for pull-request and release-candidate review. It is not the learner production service and its URL is not canonical.
- **Learner production:** a signed iOS application containing a staged, integrity-checked static export in `WebAssets`.

Content ships only inside the signed application for the current release model. Remote content packs, Universal Links, a public web companion, and remote telemetry require a new product and architecture decision.

## Required GitHub secrets

The optional hosted review-preview workflow uses:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

iOS signing credentials are intentionally not documented as repository secrets until the release organization selects its certificate/profile management approach.

## Merge quality gate

Workflow: `.github/workflows/ci.yml`

Pull requests and pushes to `main` run `npm run ci`. Release-candidate checks additionally run the static package, asset-health, rights, and iOS automated-test commands defined by the workflows. Invalid content or a failed build cannot produce a promotable artifact.

## Hosted review previews

Workflow: `.github/workflows/deploy-preview.yml`

The workflow validates the repository, builds an immutable Vercel review preview when credentials are configured, and comments the preview URL plus a link to the static `build-manifest.json`. Preview builds may include drafts through `CONTENT_INCLUDE_DRAFTS=true` or Vercel's preview environment. Learner production must exclude drafts.

There is no runtime diagnostics endpoint. A static export cannot provide that contract.

## Signed iOS production

1. Run the full release-candidate quality gates against the exact commit.
2. Generate the normalized graph, search/museum indexes, media manifest, and `build-manifest.json`.
3. Run `ios/sync-web-assets.sh`. It stages and verifies the complete export before replacing `ios/F1Chronicle/WebAssets`.
4. Generate the Xcode project and run the Swift unit/UI tests.
5. Archive the signed app together with the immutable build manifest, WebAssets integrity report, package-size report, and smoke evidence.
6. Promote the approved archive through TestFlight/App Store Connect.

The release record must identify the app version/build number, full commit, content version, content-pack ID, graph version, media-manifest version, and WebAssets hash.

## Rollback

Bundled content cannot update independently at runtime, so a failed validation, build, sync, signing, or promotion leaves the installed last-approved app unchanged.

To restore learner production:

1. identify the last approved signed archive and its build manifest;
2. re-promote that build where App Store Connect permits, or submit a new build created from the archived last-known-good source/artifact;
3. rerun the simulator/device smoke matrix and confirm the displayed manifest;
4. record the restored and rejected manifest identifiers in the release/incident record.

Hosted preview rollback is independent: retain or redeploy the previous immutable preview artifact. It never substitutes for iOS rollback.

## Diagnostics contract

Every built static package exposes `/build-manifest.json`. Runtime error reports use allowlisted fields from that manifest and remain local-only. They exclude search text, feedback drafts, personal identifiers, arbitrary URLs, and page content.
