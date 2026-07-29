# Operations

## Scope

This document covers signed-iOS release protection, static package health, media rights, local diagnostics, smoke testing, and restoration. Hosted Vercel builds are review previews, not learner production.

## Release protection

- `.github/workflows/ci.yml` is the required merge gate for `main`.
- Release-candidate workflows run content/schema checks, tests, static build, package/performance audits, asset and rights checks, and applicable iOS tests before promotion.
- `ios/sync-web-assets.sh` stages and verifies the full artifact before replacing `WebAssets`; a failed build or verification leaves the prior staged bundle intact.
- The signed archive and evidence are keyed by `build-manifest.json`.
- Rollback restores the last approved signed application/content unit. Content, graph, media manifest, and app code are never mixed across release records.

## Scheduled and release-candidate audits

- `npm run perf:routes` measures representative static route families.
- `npm run ops:check-assets` verifies declared media sources and reports affected media IDs and entities.
- `npm run ops:rights-report` reports blocked/expiring media rights.
- `npm run ops:smoke` verifies primary routes on a static review host.
- The iOS test command verifies navigation/resource policies, bundle-manifest compatibility, and supported simulator journeys.

Release evidence must include immutable performance, size-delta, asset-health, rights, accessibility, and simulator/device results keyed by app/content/build-manifest versions. A budget exception requires an owner, reason, expiry, and target release; retry/flakiness is never recorded as a passing result.

## Alert and exception routing

| Event | Severity | Owner | Response | Resolution evidence |
| --- | --- | --- | --- | --- |
| CI, staging, signing, or promotion failure | High | Engineering lead | Same business day | Linked run plus green replacement candidate |
| Bundled asset or manifest incompatibility | High | Engineering lead + content maintainer | Before promotion | Passing integrity and simulator evidence |
| Rights expiry within 30 days | Medium | Product owner + content maintainer | Within 2 business days | Updated metadata or approved replacement |
| Expired/blocked asset | High | Product owner + engineering lead | Before the next candidate | Passing rights report and reviewed content diff |
| Size/performance budget miss | High | Engineering lead + QA | Before promotion or approved expiring exception | Versioned report and exception record |

## Privacy and diagnostics

- No third-party analytics SDK or JavaScript/native telemetry bridge ships.
- `/build-manifest.json` identifies the exact static package.
- Route and renderer failures are written only to bounded local diagnostics with allowlisted technical fields.
- Search text, feedback drafts, personal identifiers, arbitrary URLs, and page content are excluded.
- Future telemetry requires a privacy-reviewed ADR covering events, consent, retention, transport, ownership, and disabled behavior.

## Release-candidate smoke matrix

Before promotion:

1. verify the bundled manifest and integrity report;
2. launch offline on the lowest supported iPhone simulator/device and a current device;
3. open `/`, `/seasons/1988/`, `/museum/`, `/cars/mclaren-mp4-4/`, and `/technologies/honda-ra168e/`;
4. verify search from root, museum, and a subject route;
5. verify an intentionally missing shared index shows the accessible unavailable/retry state;
6. verify an unapproved origin/path cannot replace the local app;
7. record model, OS, app build, manifest ID, result, and evidence location.

Hosted review smoke (`SMOKE_BASE_URL=<preview-url> npm run ops:smoke`) is useful review evidence but does not replace the iOS matrix.

## Restoration exercise

1. identify the last approved archive and its manifest;
2. install/promote that last-known-good build using the release process;
3. rerun the offline smoke matrix;
4. record the rejected and restored manifest IDs, device/OS, timestamp, and evidence location.
