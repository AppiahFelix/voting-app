# Live Election — voting app

A voting system with two sides:

- **Admin** — add aspirants (name, position, category, sex), generate one-time
  voter access codes, open/close voting, set the election title.
- **Voters** — enter their access code, pick one candidate per position, submit.
- **Results** — a public page that updates live (no refresh needed) as votes
  come in, grouped by position.

Built with Next.js (App Router) + Supabase (Postgres + Realtime). Deploys to Vercel.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's ready, open **SQL Editor** → New query, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates
   all tables, security policies, and turns on realtime for the `votes` table.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server only)

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=choose-a-strong-password
SESSION_SECRET=any-long-random-string
```

`ADMIN_PASSWORD` is what you'll type in at `/admin/login`. `SESSION_SECRET`
just needs to be a long random string — it signs the admin's login cookie.

## 3. Run locally

```
npm install
npm run dev
```

Visit `http://localhost:3000`.

- `/admin/login` — sign in as admin, add aspirants, generate voter codes.
- `/vote` — where voters go to cast their ballot.
- `/results` — public live results.

## 4. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel: **Add New → Project**, import the repo.
3. Under **Environment Variables**, add the same five variables from step 2.
4. Deploy. That's it — no other config needed.

## How voting works

- As admin, generate as many access codes as you have voters (e.g. 200 codes
  for 200 voters). Each code can be used exactly once.
- Distribute codes privately (print them, message them individually, etc.) —
  anyone holding an unused code can vote once.
- A voter enters their code at `/vote`, sees one ballot section per position,
  picks one aspirant per position, and submits. The code is then marked used
  and can't vote again.
- `/results` subscribes to Supabase Realtime and updates the tally the moment
  a new vote is recorded — no polling, no manual refresh.
- From the admin dashboard you can close voting at any point (new codes will
  be rejected) and reopen it later, and rename the election.

## Notes on security

- All writes (adding aspirants, generating codes, recording votes) happen
  through server-side code using the Supabase **service role** key, which
  never reaches the browser.
- The browser only ever holds the **anon** key, which per `supabase/schema.sql`
  can read aspirants and vote counts, but has no access to the `voters` table
  — so codes can't be enumerated or guessed from the client.
- The admin session is a signed, HTTP-only cookie checked by `src/proxy.ts`
  (Next.js middleware) on every `/admin/*` route.
