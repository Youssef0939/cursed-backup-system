# SummonFighter 💀⚡

> Real fighters. Real skill. One click and a fighter shows up.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** Vercel

---

## Setup (5 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/summonfighter
cd summonfighter
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **SQL Editor** → paste the contents of `schema.sql` → Run

### 3. Get Your Credentials

In Supabase: **Settings → API**
- Copy `Project URL`
- Copy `anon public` key

### 4. Set Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/your-server
NEXT_PUBLIC_OWNER_CODE=your-secret-code
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DISCORD_INVITE`
   - `NEXT_PUBLIC_OWNER_CODE`
4. Deploy ✅

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — Hero, live feed, top fighters |
| `/fighters` | Leaderboard of all fighters |
| `/profile` | Your stats and battle history |
| `/settings` | Username, Discord, online status |
| `/auth` | Login / Register |
| `/pending/[id]` | Waiting for fighter acceptance |
| `/dashboard` | Owner command center (secret code) |

## Rank System (Jujutsu Kaisen inspired)

| Rank | Requirement |
|------|-------------|
| Rookie | 0–4 wins |
| Fighter | 5–19 wins |
| Sorcerer | 20–49 wins |
| Special Grade | 50+ wins + 4.5★ avg rating |
