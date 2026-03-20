# 🏆 Daily Winner

A social mobile-first web app where friend groups compete over a daily prompt. One prompt, everyone answers, anonymous voting, one winner crowned per day.

---

## Tech Stack

- **Next.js 15** (App Router, Server Actions, Server Components)
- **Tailwind CSS v4**
- **Supabase** (Auth + Postgres database)
- **TypeScript**

---

## Setup Instructions

### 1. Clone / open the project

The project lives in the `daily-winner/` folder.

### 2. Create a Supabase project

1. Go to [https://app.supabase.com](https://app.supabase.com) and create a new project
2. Copy your **Project URL** and **Anon Key** from **Project Settings → API**

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the database schema

In your Supabase dashboard, go to **SQL Editor** and run these files in order:

1. `supabase/schema.sql` — Creates all tables, RLS policies, and the profile trigger
2. `supabase/seed.sql` — Inserts 50 prompts into the prompt bank

### 5. Disable email confirmation (for local dev/demo)

In Supabase dashboard:
**Authentication → Providers → Email → Disable "Confirm email"**

This lets users sign up and immediately start playing without email verification.

### 6. Install dependencies & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Daily Phase Schedule (UTC)

| Phase      | Time (UTC)     | What happens                        |
|------------|----------------|-------------------------------------|
| Submission | 12:00 AM–12:00 PM | Users write their answers        |
| Voting     | 12:00 PM–8:00 PM  | Anonymous voting on submissions  |
| Results    | 8:00 PM–12:00 AM  | Winner revealed with all votes   |

> To test the full loop locally, you can temporarily change the hours in `lib/phases.ts` (`PHASE_CONFIG`).

---

## App Structure

```
app/
  page.tsx                     → Landing page
  (auth)/
    login/page.tsx             → Login
    signup/page.tsx            → Sign up
  (app)/
    groups/
      page.tsx                 → Groups list
      new/page.tsx             → Create or join a group
      [id]/
        page.tsx               → Group detail (phase-aware)
        history/page.tsx       → Past rounds & winners

components/
  ui/                          → Button, Card, Input, Badge, Avatar, Countdown
  navigation/                  → BottomNav, TopBar
  rounds/                      → PhaseIndicator, SubmissionForm, VotingInterface, WinnerReveal

lib/
  supabase/                    → Browser + server Supabase clients
  actions/                     → Server Actions (auth, groups, rounds, submissions, votes)
  phases.ts                    → Phase calculation logic
  utils.ts                     → Helpers (cn, formatCountdown, etc.)

supabase/
  schema.sql                   → Full DB schema + RLS policies
  seed.sql                     → 50 daily prompts
```

---

## Database Schema

| Table          | Purpose                                         |
|----------------|-------------------------------------------------|
| `profiles`     | User profiles (username, avatar color)          |
| `groups`       | Private friend groups                           |
| `group_members`| Who belongs to which group (with role)          |
| `prompts`      | Bank of daily prompts                           |
| `rounds`       | One round per group per day (links prompt)      |
| `submissions`  | Each user's text answer for a round             |
| `votes`        | One vote per user per round                     |

---

## Key Product Rules

- **One submission per user per round** — enforced by DB unique constraint + app check
- **No self-voting** — enforced in the `castVote` server action
- **One vote per round** — enforced by DB unique constraint
- **Anonymous voting** — submissions shown without author names during voting phase
- **Private groups only** — no public feed, join by 6-char invite code only

---

## Testing the Loop

Since phases are time-based (UTC), the easiest way to test the full loop locally:

1. Open `lib/phases.ts`
2. Change the phase boundaries to suit your testing window, e.g.:

```ts
// Make submission phase end at 23:59 (always submission for one day)
export const PHASE_CONFIG = {
  submission: { startHour: 0,  endHour: 23, ... },
  voting:     { startHour: 23, endHour: 24, ... },
  results:    { startHour: 24, endHour: 25, ... },
}
```

Or set phases by checking minute instead of hour for fast testing.

---

## Expanding the App

The codebase is organized for easy expansion:

- **Real-time updates**: Add Supabase Realtime subscriptions in group detail page
- **Push notifications**: Use Supabase Edge Functions + web push
- **Image submissions**: Add `image_url` column to `submissions`, integrate Supabase Storage
- **Streaks**: Track daily participation in a separate `streaks` table
- **Reactions**: Add emoji reactions on the results screen
- **Multiple prompts per category**: Extend `prompts` table with tags/weights

---

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Set the two environment variables in your Vercel project settings.
