# RevivePay AI — Frontend Client

Premium dark-mode Next.js dashboard for the AI Revenue Recovery Engine.

## Tech Stack

- **Framework:** Next.js 15 (App Router + Turbopack)
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **Icons:** Lucide React
- **Font:** Inter (UI) + JetBrains Mono (data)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with metrics, pipeline visualization, live data |
| `/orchestrator` | Trigger the full AI recovery pipeline |
| `/merchants` | Merchant cards |
| `/revenue-events` | Revenue event log with status breakdown |
| `/recovery-cases` | Recovery case list with filters + drill-down |
| `/recovery-cases/[id]` | Full case detail: AI decisions, actions, outcomes, audit timeline |
| `/ai-decisions` | All AI strategy decisions with confidence scores |
| `/recovery-actions` | Recovery actions execution log |
| `/outcomes` | Outcome results with recovered amounts |
| `/revenue-attribution` | Attributed revenue with DIRECT/ASSISTED breakdown |
| `/audit` | Live audit trail (table + timeline view) |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API URL
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:4000

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> Make sure the backend server is running on port 4000 first.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API base URL |

## Design System

All design tokens live in `src/app/globals.css` as CSS variables:

```css
--bg-base        /* #070a12 — page background */
--bg-surface     /* #0c1020 — cards */
--bg-elevated    /* #111828 — elevated surfaces */
--gold           /* #f0b429 — primary accent */
--blue           /* #4d7af7 — interactive */
--green          /* #10b981 — success */
--red            /* #ef4444 — failure */
--purple         /* #8b5cf6 — AI elements */
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Dashboard
│   ├── globals.css         # Design tokens + Tailwind v4
│   ├── orchestrator/       # Pipeline trigger
│   ├── recovery-cases/
│   │   ├── page.tsx        # Case list
│   │   └── [id]/page.tsx   # Case detail
│   └── ...                 # All other pages
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── PipelineFlow.tsx    # Animated pipeline visualization
│   ├── LoadingState.tsx    # Loading/error/empty states
│   └── StatusBadge.tsx     # Colored status badges
└── lib/
    ├── api.ts              # Centralized API client
    ├── types.ts            # TypeScript interfaces
    └── utils.ts            # Formatting + badge utilities
```
