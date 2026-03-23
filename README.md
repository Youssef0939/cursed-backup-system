# SummonFighter v2 💀⚡

> Real fighters. Real skill. One click and a fighter shows up.

## What's New in v2

- **Role system** — Client vs Fighter (fighters require owner approval)
- **Fighter applications** — users apply, owner approves/rejects
- **Real-time chat** — after accepting a request, owner and user chat inside the site
- **Rank system** — Initiate → Fighter → Captain → Warlord → Special Grade
- **Roblox username** — users can link their Roblox identity
- **Request types** — 1v1, Team Fight, Ranked Help, Anti-Toxic
- **Battle status** — pending → accepted → in_progress → done
- **Rank progress bar** — shows progress to next rank
- **Scarcity indicators** — "Only X elite fighters online" when few are available
- **Full Settings page** — username, discord, roblox, password, preferences all working
- **Cinematic ending screen** — "ENEMY ELIMINATED. YOU'RE SAFE NOW."

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** Vercel

---

## Setup (5 minutes)

### 1. Install

```bash
cd summonfighter
npm install
```

### 2. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. **SQL Editor → New Query** → paste `schema.sql` contents → **Run**

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/your-server
NEXT_PUBLIC_OWNER_CODE=your-secret-code
```

### 4. Run

```bash
npm run dev
```

### 5. Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add the 4 env variables in Vercel dashboard
4. Deploy ✅

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, live feed, rank ladder, top fighters |
| `/fighters` | Leaderboard with online/all filter |
| `/profile` | Stats, rank progress bar, battle history |
| `/settings` | Profile, preferences, password — all working |
| `/auth` | Login + Register with role selection |
| `/pending/[id]` | Pending → Chat → Rating flow |
| `/dashboard` | Owner: requests + fighter applications + chat |

## Rank System

| Rank | Wins Required | Description |
|------|--------------|-------------|
| 🪖 INITIATE | 0+ | Just joined the network |
| ⚔️ FIGHTER | 5+ | Proven in battle |
| 🧠 CAPTAIN | 20+ | Commands respect |
| 🔥 WARLORD | 50+ | Feared on the battlefield |
| 💀 SPECIAL GRADE | 100+ wins + 4.5★ | Legendary. Untouchable. |

## How Fighter Approval Works

1. User registers and selects "I want to be a fighter"
2. They fill in a reason and Roblox username
3. Owner sees the application in `/dashboard → Fighter Applications`
4. Owner clicks "APPROVE" → user role becomes `fighter`
5. Fighter now appears in leaderboard and can accept requests
