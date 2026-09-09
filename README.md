# UniPilot

An AI-powered university study operating system, built one milestone at a time.

## Milestone 1

This foundation uses Next.js App Router, TypeScript (strict mode), and Tailwind CSS.

Routes:
- `/`: responsive homepage with Get Started and Sign In links.
- `/login`: sign-in UI preview.
- `/register`: registration UI preview.
- `/dashboard`: public placeholder, not an authenticated dashboard.

Authentication inputs and submission buttons are disabled intentionally. No credentials are collected or stored. Milestone 1 has no service integrations; Milestone 2 adds SQL schema files only, without connecting the application to a database.

## Milestone 2: database foundation

The initial Supabase PostgreSQL migration is `supabase/migrations/20260909000000_initial_schema.sql`. It creates these seven tables in the `public` schema:

| Table | Purpose and relationships |
| --- | --- |
| `profiles` | Optional display name; `id` is also the Supabase `auth.users.id` foreign key. |
| `subjects` | A user's named university subjects. |
| `materials` | Subject-owned file metadata: filename, MIME type, size in bytes, and an optional storage path. No files, buckets, or upload behavior are created. |
| `topics` | Subject-owned topics, optionally linked to a source material in that same subject. |
| `topic_progress` | One progress row per user/topic, with status defaulting to `not_started`. |
| `exams` | A subject's exam title, calendar date, and optional notes. |
| `generated_content` | A topic's content type and JSON object payload; no generation is implemented. |

All primary keys are UUIDs. Profiles reuse the auth user's UUID; other tables generate one with `gen_random_uuid()`. Each table has `created_at` and `updated_at`; update triggers preserve `created_at` and refresh `updated_at`.

Learning status is restricted to `not_started`, `learning`, `needs_review`, or `mastered`. Content type is restricted to `explanation`, `example`, `quiz`, or `practice`. The JSON payload must be an object; type-specific payload validation belongs to the later generation milestone.

Material metadata requires a positive file size and matching filename extension/MIME type for PDF, PNG, JPG/JPEG, or WEBP. These metadata constraints do not inspect actual file bytes. Actual file validation and a maximum upload size will be implemented with uploads.

### Ownership and deletion

Every table has RLS enabled. Authenticated users can select, insert, update, and delete only their own rows, using `auth.uid() = user_id` (or `id` for profiles). Both `USING` and `WITH CHECK` are explicit, so writes cannot transfer ownership. The `anon` role has no table privileges.

Composite foreign keys enforce matching owners across relationships, even if a request submits another user's subject or topic ID. Topic-to-material links also enforce matching subjects. Indexes support owner filtering, subject/topic lookups, progress status, and upcoming exam queries.

Deleting an auth user cascades to all their records. Deleting a subject cascades to its materials, topics, exams, and dependent progress/content. Deleting a material preserves its topics and clears only their source-material reference. Deleting a topic cascades to its progress and generated content. Deleting a profile does not delete the auth account or academic records.

No auth-user trigger is installed: future authentication server logic can create a profile explicitly. Academic records reference `auth.users` directly and do not require a profile first. Privileged database owners and service roles can bypass RLS, so their credentials must never be exposed to clients. See [Supabase's RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Applying and checking the schema

The migration is versioned SQL, intended to run once on an empty Supabase project. It is not applied to a live project by this milestone. For a manual initial setup, execute the entire migration in the Supabase SQL Editor as the database owner. It runs in a transaction. If adopting the Supabase CLI afterwards, reconcile its migration history with this manually applied version before using `db push`; do not apply the same migration twice.

On a disposable Supabase database with this migration applied, execute `supabase/tests/database_foundation.sql` as the database owner. It creates two test users and verifies owner CRUD, cross-user and anonymous denial, ownership transfers, foreign keys, enum/check constraints, timestamp triggers, and deletion behavior. It rolls its fixtures back. With PostgreSQL connection settings configured securely in your shell, it can also be run with:

```sh
psql -v ON_ERROR_STOP=1 -f supabase/tests/database_foundation.sql
```

The migration and SQL checks were executed successfully using an isolated PGlite PostgreSQL runtime with minimal `auth.users`, `auth.uid()`, and Supabase role stubs. This validates SQL and RLS behavior, but is not a live Supabase integration test. Rerun the SQL checks against a disposable Supabase project before deployment. The temporary validation runtime is not an application dependency.

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

`typecheck` generates Next.js route types before running TypeScript, so it also works on a fresh checkout. Database SQL checks are described above; no frontend test runner is installed. The production server requires a successful build.

ESLint is pinned to 9.39.5 because the React lint plugin bundled with the current Next.js configuration fails under ESLint 10. npm reports an upstream deprecation notice for ESLint 9; upgrade when the bundled plugin supports ESLint 10.

## Important files

- `src/app/`: routes, metadata, root layout, and global styles.
- `src/components/layout/site-header.tsx`: shared branding and navigation.
- `src/components/auth/auth-preview.tsx`: shared, nonfunctional authentication preview.
- `src/app/globals.css`: Tailwind theme and shared button styles.
- `tsconfig.json`: strict TypeScript configuration and `@/*` imports.
- `eslint.config.mjs`: Next.js and TypeScript lint rules.
- `package-lock.json`: reproducible dependency versions; use `npm ci` after cloning.

- `supabase/migrations/`: versioned database schema, constraints, indexes, triggers, and RLS policies.
- `supabase/tests/database_foundation.sql`: transactional database/security checks.

Server modules and service integrations will be introduced only in their requested milestones. Milestone 2 adds no authentication UI, upload functionality, OpenAI integration, or application database connection.
