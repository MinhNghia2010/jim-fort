# Jim Fort

Jim Fort is a gym operations app for running a fitness business from one place. It keeps the owner, manager, PT, and member workflows in one system so the team can handle facilities, memberships, subscriptions, requests, schedules, payments, vouchers, feedback, and profiles without jumping between tools.

## What The App Does

- Owners manage facilities, rooms, equipment, memberships, vouchers, staff, revenue, and feedback.
- Managers handle member creation, subscriptions, facility requests, staff directory tasks, and day-to-day operational follow-up.
- Personal trainers review their request queue, member assignments, and session schedules.
- Members view subscriptions, payments, trainers, schedules, sessions, and feedback.

## Core Areas

- Facility management for rooms and equipment
- Membership and subscription workflows
- PT request and session scheduling
- Member payments and voucher tracking
- Feedback and profile management

## Tech Stack

- Next.js 16 App Router with Turbopack
- React 19 and TypeScript
- Supabase Auth, Postgres, and SSR clients
- Tailwind CSS 4 and shadcn/ui components
- Sonner toasts and lucide-react icons

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` with the Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-only. It is used by backend server actions for privileged operations such as account cleanup, subscription updates, and owner-managed deletes.

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev        # Start the local Next.js dev server
npm run lint       # Run ESLint
npm run test       # Run focused Node tests
npm run typecheck  # Run TypeScript checks
npm run build      # Create a production build
npm run start      # Start the production server after build
npm run db:snapshot # Dump a Supabase schema snapshot when Docker is running
```

## Project Layout

- `app/(auth)` contains auth routes.
- `app/(main)` contains protected app routes and server actions.
- `components/screens` contains role-specific page experiences.
- `components/ui` contains shadcn/ui primitives.
- `lib/auth` centralizes authenticated user and role context.
- `lib/features` contains shared feature data helpers and domain utilities.
- `lib/supabase` contains browser, server, admin, and proxy middleware clients.

## Roles

Route access is defined in `lib/routes.ts` for four roles:

- `owner`: full gym management, revenue, facilities, memberships, vouchers, staff, feedback, and members.
- `manager`: managed facility workflows for members, subscriptions, requests, vouchers, staff directory, and feedback.
- `pt`: PT requests, assigned members, schedules, and session workflows.
- `member`: memberships, subscriptions, schedules, trainers, payments, feedback, and profile workflows.

## Supabase Notes

The app is currently wired to a Supabase project through environment variables. Historical migration files have intentionally been reset from `supabase/migrations`, so this repository does not currently provide a full database rebuild path from migrations alone.

Use `npm run db:snapshot` to generate `supabase/schema.sql` from the linked project once Docker is running. See `supabase/README.md` for the migration-history details.

Useful Supabase CLI commands:

```bash
supabase --version
supabase migration list --linked
supabase db query --linked "select now();"
```

## Before Pushing Changes

Run the same checks used for the current main branch:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```
