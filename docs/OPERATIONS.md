# Operations

## Scope

This document records the Epic H operational release baseline for:

- deployment protection;
- production asset monitoring;
- media-rights monitoring;
- alert ownership;
- smoke testing and rollback.

## Deployment protection

- `.github/workflows/ci.yml` is the required merge gate for `main`.
- `.github/workflows/deploy-production.yml` reruns `npm run ci` before every production deployment.
- Production deploys use Vercel immutable builds plus `vercel deploy --prebuilt --prod`, so a failed build or failed deploy cannot replace the previous successful production version.
- Rollback is performed by promoting the previous successful Vercel deployment, which restores the matching built application and content hash together.

## Scheduled / on-demand audits

- `npm run perf:routes`
  Measures the representative route families against the mobile PRD budgets and writes committed evidence to `docs/performance/us-h02-route-family-performance.{json,md}`.
- `npm run ops:check-assets`
  Verifies every declared media asset source is reachable and reports the affected media IDs plus referencing entities.
- `npm run ops:rights-report`
  Reports non-publishable rights statuses and media whose `rights.expiresAt` is within 30 days or already expired.
- `npm run ops:smoke`
  Runs the post-deploy smoke test against `SMOKE_BASE_URL` (default `http://127.0.0.1:3000`) and verifies the primary route markers.

## Alert routing

| Alert | Severity | Owner | Acknowledge | Resolution evidence |
| --- | --- | --- | --- | --- |
| CI or production deploy failure | High | Engineering lead | Within same business day | Linked failed workflow run and follow-up green deploy |
| Broken production asset | High | Engineering lead + content maintainer | Within same business day | Passing `ops:check-assets` output and confirmed route reload |
| Rights expiry within 30 days | Medium | Product owner + content maintainer | Within 2 business days | Updated rights metadata or approved asset replacement |
| Rights already expired / blocked asset status | High | Product owner + engineering lead | Same business day before next deploy | Updated metadata plus passing `ops:rights-report` |

Escalation path:

1. Assigned owner acknowledges in the workflow run, issue, or incident thread.
2. If no acknowledgement arrives inside the window above, escalate to the engineering lead.
3. If the issue blocks publication or legal compliance, pause production deploys until evidence is attached.

## Analytics privacy baseline

- The project currently ships no third-party analytics SDK.
- `/api/diagnostics` and renderer/route error reports include version and technical context only; they do not collect user-entered search text, feedback drafts, or personal identifiers.
- Any future analytics addition must document event names, retention, identifiers, and explicit confirmation that user-authored content is excluded before launch.

## Smoke test

Run after every production deploy:

1. Open `/` and confirm the timeline renders and the museum link works.
2. Open `/seasons/1988` and confirm champion summary plus race list render.
3. Open `/museum` and verify tabs and search load.
4. Open `/cars/mclaren-mp4-4` and `/technologies/honda-ra168e`.
5. Run `SMOKE_BASE_URL=<deployment-url> npm run ops:smoke`.
6. Trigger `npm run ops:check-assets` and `npm run ops:rights-report` in the release checkout or inspect their latest CI artifacts.

## Rollback exercise

1. Identify the last healthy production deployment in Vercel.
2. Promote that deployment to production.
3. Re-run `SMOKE_BASE_URL=<restored-deployment-url> npm run ops:smoke` and the smoke checklist above.
4. Capture the restored deployment URL, original failing deployment URL, and the verification timestamp in the incident record.
