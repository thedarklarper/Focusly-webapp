# Focusly — WebApp

Focusly turns focus into a flock of duck companions. Less scroll. More soul.

This is the **web version** of the iOS app (Expo) at
[github.com/thedarklarper/Focusly](https://github.com/thedarklarper/Focusly).
It reuses the exact game engine, duck roster, and Supabase schema/sync logic from
the iOS app — only the UI layer was re-implemented for the browser.

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (same project as the iOS app — auth + the 6 existing tables)
- **Hosting:** Vercel
- **Layout:** phone-width, mobile-first — designed to run in a browser on iOS Safari

## Run locally

Requires Node.js 20+ (this repo was validated on Node 22).

```bash
npm install
npm run dev
# open http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Environment

Copy `.env.example` to `.env.local` (already provided) and set:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key>
```

Use **only** the public project URL and the publishable/anon key. Never put the
Postgres connection string or a `service_role`/secret key in the browser.

## Supabase

This app talks directly to Supabase from the browser. It does **not** create or
alter any tables. It reads/writes these existing tables:

- `profiles` (id, username, breadcrumbs, hatching_credits, trophies, screen_time_minutes, stamina, active_duck_id)
- `ducks` (catalog — read only)
- `user_ducks` (id, user_id, duck_id, level, xp, energy, is_active, is_asleep)
- `focus_sessions` (id, user_id, duration_minutes, breadcrumbs_earned, hatching_credits_earned, screen_time_minutes_earned, completed)
- `battles` (id, user_id, user_duck_id, opponent_duck_id, result, trophies_earned, breadcrumbs_earned, screen_time_minutes_earned)
- `transactions` (id, user_id, type, breadcrumbs_change, hatching_credits_change, screen_time_minutes_change, trophies_change, description)

Row Level Security must allow `auth.uid() = user_id` (or `= id` for `profiles`);
`ducks` should be readable by signed-in users.

**Auth redirects:** in Supabase Dashboard → Authentication → URL Configuration,
add `http://localhost:3000` and your Vercel domain to the Site URL / Redirect URLs
(needed for email confirmation and password reset links on the web).

### Google sign-in

The Profile screen has a **Continue with Google** button (Supabase OAuth). To enable it:

1. Supabase Dashboard → **Authentication → Providers → Google** → enable.
2. Create an OAuth Client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
3. Paste the Google **Client ID** and **Client Secret** into the Supabase Google provider.
4. Add `http://localhost:3000` and your Vercel URL to Supabase **Redirect URLs**.

After signing in, progress auto-syncs to that account (debounced push of pending
changes). The timer only settles rewards when it reaches 0:00; cancelling gives none.

## Deploy to Vercel

1. Push this repo to GitHub (see below).
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected). Leave build/output defaults.
4. Add Environment Variables (Production + Preview + Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy**. Then copy the Vercel URL back into Supabase Auth Redirect URLs.

## Run in a browser on iOS

After Vercel deploys, open the URL in **Safari** on the iPhone. The layout is
phone-width and mobile-first. For an app-like feel: Share → **Add to Home Screen**.

## Project structure

```
src/
  app/
    layout.tsx        # GameProvider + phone frame + bottom nav
    page.tsx          # Home (focus timer, currencies, protection)
    ducks/page.tsx    # Roster, stats, active selection
    duck-off/page.tsx # Turn-based battle
    shop/page.tsx     # Egg hatching + reveal
    trophy/page.tsx   # Trophy road milestones
    profile/page.tsx  # Supabase auth + sync status
  game/               # engine.ts + types.ts (ported verbatim from iOS)
  data/ducks.ts       # Duck roster (sprite paths -> /public/ducks)
  lib/supabase.ts     # Browser Supabase client + auth helpers
  services/storage.ts # localStorage persistence + outbox sync
  providers/GameProvider.tsx
  components/         # ui, DuckArt, BottomNav
public/ducks/*.png    # Duck artwork
```

## Honest limitations (same constraints as the iOS prototype)

- A browser **cannot** inspect real app usage or block apps. Screen-time,
  protection and distraction flows are clearly labeled **simulations**.
- Sync is a **single-device snapshot** (no revision columns/server RPCs) — not
  conflict-free multi-device or cheat-proof.
- Eggs, gear, blacklist and streaks stay **local** because the cloud schema has
  no columns for them.
