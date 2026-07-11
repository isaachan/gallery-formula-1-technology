# F1 Track Chronicle

Mobile-first Formula 1 history learning app based on the design prototype in [design/README.md](/Users/kai.han/code/gallery-formula-1-technology/design/README.md) and the delivery sequence in [docs/DEVELOPMENT_PLAN.md](/Users/kai.han/code/gallery-formula-1-technology/docs/DEVELOPMENT_PLAN.md).

## Prerequisites

- Node.js `22.22.0`
- npm `10.9.4`

The pinned Node version is also recorded in [.nvmrc](/Users/kai.han/code/gallery-formula-1-technology/.nvmrc).

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Quality Commands

- `npm run dev`: start the local development server
- `npm run build`: create the production build
- `npm run start`: serve the production build locally
- `npm run ci`: run the full local CI command chain
- `npm run format`: check formatting with Prettier
- `npm run format:write`: apply formatting with Prettier
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript without emitting files
- `npm run test`: run unit tests
- `npm run test:coverage`: run unit tests with coverage
- `npm run test:watch`: run unit tests in watch mode
- `npm run validate:content`: validate required repository content directories

## Environment Variables

Copy [.env.example](/Users/kai.han/code/gallery-formula-1-technology/.env.example) to `.env.local` for local development.

- `NEXT_PUBLIC_SITE_URL`: canonical base URL for local or deployed app links
- `CONTENT_ROOT`: location of the repository-managed content directory

The example file contains no secrets.

## Deployment

Deployment automation for `US-A02` is documented in [docs/DEPLOYMENT.md](/Users/kai.han/code/gallery-formula-1-technology/docs/DEPLOYMENT.md).

- Pull requests deploy unique Vercel previews through GitHub Actions
- Pushes to `main` deploy production automatically
- Diagnostics are exposed at `/api/diagnostics`
