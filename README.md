# UniPilot

An AI-powered university study operating system, built one milestone at a time.

## Milestone 1

This foundation uses Next.js App Router, TypeScript (strict mode), and Tailwind CSS.

Routes:
- `/`: responsive homepage with Get Started and Sign In links.
- `/login`: sign-in UI preview.
- `/register`: registration UI preview.
- `/dashboard`: public placeholder, not an authenticated dashboard.

Authentication inputs and submission buttons are disabled intentionally. No credentials are collected or stored. There is no Supabase, OpenAI, database, upload functionality, or backend API in this milestone.

## Run locally

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No environment variables are required; `.env.example` documents this. Keep real `.env` files out of Git. Never put secret keys in variables prefixed with `NEXT_PUBLIC_`.

## Checks and production build

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`typecheck` generates Next.js route types before running TypeScript, so it also works on a fresh checkout. No automated test suite is installed yet. The production server requires a successful build.

ESLint is pinned to 9.39.5 because the React lint plugin bundled with the current Next.js configuration fails under ESLint 10. npm reports an upstream deprecation notice for ESLint 9; upgrade when the bundled plugin supports ESLint 10.

## Important files

- `src/app/`: routes, metadata, root layout, and global styles.
- `src/components/layout/site-header.tsx`: shared branding and navigation.
- `src/components/auth/auth-preview.tsx`: shared, nonfunctional authentication preview.
- `src/app/globals.css`: Tailwind theme and shared button styles.
- `tsconfig.json`: strict TypeScript configuration and `@/*` imports.
- `eslint.config.mjs`: Next.js and TypeScript lint rules.
- `package-lock.json`: reproducible dependency versions; use `npm ci` after cloning.

Server modules, database migrations, and service integrations will be introduced only in their requested milestones.
