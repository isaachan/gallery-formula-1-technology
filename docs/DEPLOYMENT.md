# Deployment

## Target platform

This repository is configured for:

- `GitHub Actions` as the CI and deployment orchestrator
- `Vercel` for immutable preview and production deployments

## Required GitHub secrets

Set these repository secrets before enabling the deployment workflows:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Workflow behavior

### CI

Workflow: `.github/workflows/ci.yml`

Runs on pull requests and pushes to `main`:

- `npm run format`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run validate:content`
- `npm run build`

This is the required merge gate for `main`.

### Preview deployments

Workflow: `.github/workflows/deploy-preview.yml`

For each pull request, the workflow:

1. installs dependencies;
2. reruns the full quality gates;
3. creates a Vercel preview deployment;
4. comments the unique preview URL on the pull request.

The preview deployment also exposes `/api/diagnostics`.

### Production deployments

Workflow: `.github/workflows/deploy-production.yml`

On every successful push to `main`, the workflow:

1. reruns the full quality gates;
2. performs a production Vercel build;
3. deploys the immutable build to production.

## Atomic deploy and rollback

Vercel deployments are immutable. Production traffic moves to a completed deployment only after the deployment succeeds, which makes release swaps atomic.

Rollback is done by promoting a previous successful deployment in Vercel. That previous deployment remains available because each production deploy is versioned independently.

## Diagnostics contract

The application exposes deployment diagnostics at:

- `/api/diagnostics`

The response includes:

- `appVersion`
- `contentVersion`
- `gitSha`
- `generatedAt`
