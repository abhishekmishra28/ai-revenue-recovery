# Architectural Decisions Record (ADR)

## 1. Advanced Modular Monolith
**Decision:** Build the backend as a highly modular monolith (`server/src/modules/*`) rather than microservices.
**Reason:** Hackathons require velocity. Managing distributed state across microservices adds unnecessary overhead. The domain boundaries are strict, allowing for easy extraction to microservices later if scale requires it.

## 2. Server-side Idempotency
**Decision:** Every critical function checks the database for existing processing states before acting.
**Reason:** Payment webhooks are notoriously unreliable (they can be sent twice). If the orchestrator receives two webhooks for the same failed payment, it must not execute the AI recommendation or the payment retry twice.

## 3. Pure SVG Visualizations
**Decision:** Build dashboard charts using pure SVG and math in React components instead of heavy libraries like Chart.js or Recharts.
**Reason:** Ensures the dashboard loads instantly, is highly customizable to match the premium dark theme, and avoids unnecessary bundle bloat.

## 4. Next.js App Router & Tailwind v4
**Decision:** Use the latest frontend stack.
**Reason:** Server Components reduce client bundle size, and Tailwind v4's CSS variable system perfectly supports our custom dark theme design system (`globals.css`).
