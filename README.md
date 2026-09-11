# UniPilot

An AI-powered university study operating system, built one milestone at a time.

## Milestone 1

This foundation uses Next.js App Router, TypeScript (strict mode), and Tailwind CSS.

Routes:
- `/`: responsive homepage with Get Started and Sign In links.
- `/login`: email/password sign-in.
- `/register`: email/password registration with password confirmation.
- `/dashboard`: protected study-space placeholder with account email and Logout.

Milestone 1 introduced the page foundation, Milestone 2 added the database schema, and Milestone 3 connects authentication. Study tools remain outside the current scope.

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

No auth-user trigger is installed. Milestone 3 initializes the signed-in user's profile when they reach the dashboard, using their own session and the existing RLS policy. Repeated visits do not overwrite profile data. Academic records reference `auth.users` directly and do not require a profile first. Privileged database owners and service roles can bypass RLS, so their credentials must never be exposed to clients. See [Supabase's RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Applying and checking the schema

The migration is versioned SQL and runs in a transaction. Supabase CLI is pinned as a development dependency, and `supabase/config.toml` is initialized. Apply existing migrations through the CLI rather than recreating tables manually:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --linked --dry-run --skip-vault
npx supabase db push --linked --skip-vault
npx supabase migration list --linked
```

Complete the normal browser login when prompted. Review the dry run before pushing. The CLI records applied versions and skips them on subsequent pushes. The local project link is stored in ignored `supabase/.temp/`; each fresh checkout must be linked. Login credentials stay in the CLI's user-level credential store, outside this repository. Local config is not pushed to the project's auth or storage settings by these commands.

On a disposable Supabase database with this migration applied, execute `supabase/tests/database_foundation.sql` as the database owner. It creates two test users and verifies owner CRUD, cross-user and anonymous denial, ownership transfers, foreign keys, enum/check constraints, timestamp triggers, and deletion behavior. It rolls its fixtures back. With PostgreSQL connection settings configured securely in your shell, it can also be run with:

```sh
psql -v ON_ERROR_STOP=1 -f supabase/tests/database_foundation.sql
```

The migration and SQL checks were executed successfully using an isolated PGlite PostgreSQL runtime with minimal `auth.users`, `auth.uid()`, and Supabase role stubs. This validates SQL and RLS behavior, but is not a live Supabase integration test. Rerun the SQL checks against a disposable Supabase project before deployment. The temporary validation runtime is not an application dependency.

## Run locally

Use Node.js 22.6 or newer and npm (Node.js 24 is used for development).

```sh
npm ci
# Copy .env.example to .env.local and fill in the values below first.
npm run dev
```

Open http://localhost:3000. Keep real `.env` files out of Git. Never put secret keys in variables prefixed with `NEXT_PUBLIC_`.

## Milestone 3: authentication

Copy `.env.example` to `.env.local` and set:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project's URL, from its Connect dialog. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Its public `sb_publishable_...` key. Secret/service-role keys are not accepted. |
| `SITE_URL` | `http://localhost:3000` locally; your trusted HTTPS origin in production. |

Restart the dev server after changing environment variables. Set them before building for deployment; Next.js embeds public variables at build time. The CLI login/link is separate from application configuration and does not populate these variables.

In Supabase **Authentication → URL Configuration**, set the Site URL to match `SITE_URL` and allow `${SITE_URL}/auth/callback` (for local development, `http://localhost:3000/auth/callback`). Keep the standard signup confirmation email template with `{{ .ConfirmationURL }}` so Supabase verifies the email and forwards the PKCE code to the callback. Open confirmation links in the same browser that registered. Email confirmation settings and SMTP are not changed by this implementation. Supabase's default email service may restrict recipient addresses; configure SMTP when broader delivery is needed.

Authentication uses `@supabase/ssr` cookie sessions, server actions with Zod validation, and a Next.js proxy that refreshes sessions and redirects before rendering. Server pages also verify the current user with Supabase Auth. The dashboard initializes a missing profile only after authentication; an email-confirmation-pending signup does not attempt an anonymous profile insert. No service-role client or schema change is used.

If Supabase returns a duplicate-email error, the form displays it. With email confirmation enabled, Supabase can deliberately mask existing accounts; the confirmation message explains that existing users should sign in, without querying private users or bypassing RLS. Logout ends the current browser session. If remote revocation fails after local cookies were cleared, the login page explains that partial result.

### Manual authentication check

1. Visit `/dashboard` while signed out: it redirects to `/login`.
2. Register with an email you control, a password of at least 8 characters, and matching confirmation. Invalid fields show inline errors.
3. If email confirmation is enabled, follow the email link in the same browser. Otherwise registration opens the dashboard immediately.
4. Confirm the dashboard shows your email, then refresh to check session persistence. Visiting `/login` or `/register` while signed in should redirect back to `/dashboard`.
5. Click **Logout**. Confirm `/dashboard` redirects to `/login`, then sign in again with your email/password.
6. Try an incorrect password, mismatched confirmation, and an existing email to check error guidance.

Authentication integration tests use real Next.js routes/server actions against a local mock Supabase service. They do not create live accounts or send emails. Actual email delivery and your project's configuration still need the manual check above.

## Checks and production build

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`typecheck` generates Next.js route types before running TypeScript, so it also works on a fresh checkout. `npm test` uses Node's test runner for validation and HTTP auth integration tests; stop any running `next dev` process first because the integration test launches its own dev server. Database SQL checks are described above. The production server requires a successful build.

ESLint is pinned to 9.39.5 because the React lint plugin bundled with the current Next.js configuration fails under ESLint 10. npm reports an upstream deprecation notice for ESLint 9; upgrade when the bundled plugin supports ESLint 10.

## Important files

- `src/app/`: routes, metadata, root layout, and global styles.
- `src/components/layout/site-header.tsx`: shared branding and navigation.
- `src/components/auth/`: authentication forms, pending/error states, and logout control.
- `src/app/(auth)/actions.ts`: validated registration, login, and logout server actions.
- `src/app/auth/callback/route.ts`: email-confirmation code exchange.
- `src/lib/supabase/` and `src/proxy.ts`: browser/server clients, configuration, and session refresh.
- `src/server/auth.ts`: verified user checks and profile initialization under RLS.
- `src/types/database.ts`: types generated from the existing remote schema.
- `tests/`: validation and HTTP authentication tests using local fixtures.
- `src/app/globals.css`: Tailwind theme and shared button styles.
- `tsconfig.json`: strict TypeScript configuration and `@/*` imports.
- `eslint.config.mjs`: Next.js and TypeScript lint rules.
- `package-lock.json`: reproducible dependency versions; use `npm ci` after cloning.

- `supabase/migrations/`: versioned database schema, constraints, indexes, triggers, and RLS policies.
- `supabase/tests/database_foundation.sql`: transactional database/security checks.

No Google login, subject CRUD, uploads, or OpenAI integration is implemented. Database migrations and RLS policies remain unchanged by Milestone 3.

## Milestone 4: student dashboard

The protected dashboard now shows a welcome message, a study-plan empty state, the 12 newest subjects (with the total count), the next five exams, the five newest material metadata records, and counts for all four learning statuses. Exams include today and use UTC dates because the current profile schema has no timezone setting. Topics without progress records count as not started; exact database counts avoid Supabase's row limit.

`src/server/dashboard.ts` loads data in parallel using the existing authenticated server client, explicit user filters, and RLS. No privileged credentials or schema changes are needed. Each data section distinguishes an empty result from a database error and offers a refresh link on failure. The route has a loading skeleton, and unexpected failures use the existing application error boundary.

`npm test` also covers dashboard empty/populated states, ownership filters, exam/material query ordering, counts beyond 1,000 topics, and partial failures using local fixtures. These tests do not replace the existing SQL RLS tests or contact the live database. No subject editing, uploads, or study-plan generation is included.
