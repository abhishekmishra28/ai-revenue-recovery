# AI Revenue Recovery Agent

An autonomous but deterministic system for merchants to identify and recover lost revenue from failed payments, abandoned checkouts, and expired payment methods.

## Overview

The AI Revenue Recovery Agent combines probabilisitic AI reasoning with deterministic policy rules to automatically execute recovery actions such as payment retries, customer reminders, and targeted incentives.

## Tech Stack

### Frontend (Client)
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Architecture:** Controller/View pattern based in `/app/dashboard/page.tsx` composing domain components.

### Backend (Server)
- **Framework:** Node.js with Express
- **Language:** TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **AI Integration:** Google Gemini API
- **Architecture:** Advanced MVC / Domain-Driven Design Modules (`/server/src/modules/`)

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL Database
- Google Gemini API Key

### Server Setup
1. `cd server`
2. `npm install`
3. Configure `.env` with database and API keys.
4. `npx prisma db push`
5. `npm run dev`

### Client Setup
1. `cd client`
2. `npm install`
3. Configure `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000`
4. `npm run dev`
