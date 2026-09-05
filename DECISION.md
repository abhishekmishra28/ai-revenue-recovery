# Architectural Decision Records (ADR)

> This document records the key architectural decisions made during the design and development of RevivePay AI. Each record captures the context, the decision, the alternatives considered, and the rationale. These records serve as the authoritative reference for any future changes to the system architecture.

---

## ADR-001: Modular Monolith over Microservices

**Status:** Accepted  
**Date:** 2026-08

### Context

The system must coordinate multiple domain concerns (event ingestion, AI strategy generation, policy validation, action execution, revenue attribution) that are tightly sequenced in a single recovery pipeline. Two architectural options were considered:

- **Microservices**: Each domain as an independent deployable service communicating over HTTP or a message broker.
- **Modular Monolith**: Strict domain boundaries enforced by directory structure and TypeScript module imports, deployed as a single process.

### Decision

Build the backend as a **modular monolith** (`server/src/modules/*`) with strict domain separation.

### Rationale

| Factor               | Microservices                        | Modular Monolith (Chosen)                    |
|----------------------|--------------------------------------|----------------------------------------------|
| Development velocity | Slow — requires service contracts    | Fast — in-process function calls             |
| Distributed tracing  | Required for observability           | Not needed; single process trace             |
| Transaction safety   | Requires saga/outbox patterns        | Single Prisma transaction across domains     |
| Deployment complexity | High — multiple services to deploy  | Low — single Node.js process                 |
| Future migration     | N/A                                  | Domains can be extracted if scale demands it |

The strict domain boundaries in the codebase (no cross-module direct imports, all inter-domain calls through service interfaces) mean that microservices extraction is a deployment change, not an architectural one.

---

## ADR-002: AI as a Stateless Recommender (Not an Executor)

**Status:** Accepted  
**Date:** 2026-08

### Context

In AI-powered financial systems, two patterns exist:
- **Agentic AI**: The AI has tool-use capabilities — it can call payment APIs, write to databases, and trigger webhooks autonomously.
- **Recommender AI**: The AI outputs a structured recommendation. A separate, deterministic system validates and executes it.

### Decision

The AI is a **stateless recommender**. The `ai-strategy-engine` module accepts a JSON context payload and returns a JSON decision. It has no database connection, no HTTP client, and no tool-use capabilities.

### Rationale

In financial operations, **auditability and controllability are non-negotiable**:

1. **Regulatory compliance**: Any AI action that moves money must be traceable to a human-approved rule set. A pure recommender model satisfies this because every execution is gated by a deterministic, merchant-configured policy engine.

2. **Error containment**: An agentic AI that can retry payments autonomously could, on hallucination or prompt injection, retry the same payment dozens of times. With the recommender pattern, the policy engine's `maxRetryAttempts` rule makes this physically impossible.

3. **Trust building**: Merchants adopting AI recovery tooling for the first time need to see every decision the AI makes before it acts. The dashboard surfaces the AI's `confidence` score and `reason` text for every decision, building trust incrementally.

### Consequences

- A separate Policy Engine is required (ADR-003).
- AI latency adds to the pipeline duration, but this is acceptable given the async nature of recovery (not a real-time payment authorization path).

---

## ADR-003: Deterministic Policy Engine as a Hard Guard

**Status:** Accepted  
**Date:** 2026-08

### Context

Even with a safe, read-only AI, the system needs a mechanism to enforce merchant-defined business rules that must **never** be violated, regardless of what the AI recommends.

### Decision

Implement a dedicated `policy-engine` module that evaluates hard rules against every AI strategy decision before any action is created. The policy engine can **reject** any strategy regardless of the AI's confidence score.

### Policy Rule Examples

```typescript
// Rules evaluated by the Policy Engine (deterministic, no AI involved)
if (retryCount >= merchant.maxRetryAttempts)    → REJECT
if (lastContactedAt + cooldownMs > Date.now())   → REJECT
if (amount > merchant.maxAutoRetryAmount)         → REJECT
if (hour < 7 || hour > 22)                        → REJECT (no night-time SMS)
```

### Rationale

The Policy Engine decouples **what is optimal** (AI's job) from **what is permitted** (merchant's job). This is the correct separation of concerns for a production financial system and allows:
- Merchants to change rules without retraining the model.
- Operators to audit rejected strategies independently of the AI's reasoning.
- Zero-trust operation: even a compromised or hallucinating AI cannot cause policy violations.

---

## ADR-004: Idempotent Recovery Pipeline

**Status:** Accepted  
**Date:** 2026-08

### Context

Payment webhooks from providers (Stripe, Razorpay, etc.) are delivered with **at-least-once semantics** — the same webhook event can be sent multiple times due to network failures, provider retries, or client timeouts. Without protection, this would cause:
- Duplicate recovery cases for the same failed payment
- The AI strategy being called multiple times for the same event
- Multiple payment retries for a single failure

### Decision

Every critical function in the `recovery-orchestrator` pipeline performs an **idempotency check** against the database before proceeding. The `externalEventId` field on `RevenueEvent` is a unique index; any duplicate webhook is immediately detected and returns an `ALREADY_PROCESSED` status.

```typescript
// From recovery-orchestrator.service.ts
const existing = await prisma.recoveryCase.findFirst({
  where: { revenueEventId: event.id }
});
if (existing) return { status: "ALREADY_PROCESSED", ... };
```

### Rationale

Idempotency is a foundational requirement for any system that handles financial events. It is cheaper to add a database index and a `findFirst` check than to handle the downstream consequences of duplicate payment retries (double charges, duplicate emails, support escalations).

---

## ADR-005: Scenario Simulation Engine

**Status:** Accepted  
**Date:** 2026-08

### Context

Demonstrating and testing a revenue recovery system requires realistic data flowing through the full pipeline. Creating test data manually (creating transactions, revenue events, recovery cases) is tedious and error-prone.

### Decision

Build a dedicated `simulate` module (`server/src/modules/simulate/`) that accepts a high-level `ScenarioInput` and:
1. Creates a synthetic `Transaction` (for payment failures).
2. Creates a `RevenueEvent` with a unique `externalEventId` (bypassing idempotency).
3. Calls the full `orchestrateRecovery()` pipeline without any modifications.
4. Returns the full pipeline result with timing metadata.

### Rationale

- **Reuses 100% of production code** — the simulator does not mock or bypass any pipeline stage.
- **Enables the interactive dashboard** — the Scenario Simulator and Batch Runner pages are powered by this endpoint.
- **Unique event IDs** ensure the idempotency guard (ADR-004) never blocks simulated scenarios.
- **Interviewer-friendly** — a panel of reviewers can trigger any scenario type, observe the full AI pipeline in real-time, and see the results without needing production payment data.

---

## ADR-006: Frontend — CSS Variables Design System over Utility Classes

**Status:** Accepted  
**Date:** 2026-08

### Context

A premium, dark-mode financial dashboard requires a consistent, deeply customizable design system. Two approaches were considered:
- **Utility-first CSS** (Tailwind): Compose styles from atomic class names.
- **CSS Custom Properties** (Variables): Define design tokens as CSS variables; components reference them by name.

### Decision

Use a **CSS Custom Properties** design system defined in `client/src/app/globals.css`. All colors, spacing, typography, and component styles are defined once as variables and referenced throughout.

### Rationale

| Factor               | Utility Classes              | CSS Variables (Chosen)                    |
|----------------------|------------------------------|-------------------------------------------|
| Theme switching      | Requires class-swapping      | Change one `:root` block                  |
| Dynamic values       | Difficult                    | Easy — JS can set `style.setProperty()`   |
| Design consistency   | Developer discipline required| Enforced — only valid tokens compile      |
| Bundle size          | Purged; small                | Zero runtime — native browser feature     |

The CSS variable system perfectly supports the premium dark theme with transparent glass-morphism effects (`rgba(var(--color), 0.1)`) that utility classes cannot easily express.

---

## ADR-007: Pure SVG Charts over Charting Libraries

**Status:** Accepted  
**Date:** 2026-08

### Context

The dashboard requires data visualizations (sparklines, bar charts, trend indicators). Third-party charting libraries (Recharts, Chart.js, Victory) are fully-featured but add 150–400KB to the JavaScript bundle.

### Decision

Implement all dashboard visualizations as **pure SVG** computed directly in React components.

### Rationale

- **Zero bundle impact**: SVG is rendered by the browser, not JavaScript.
- **Full theme integration**: SVG `stroke` and `fill` values can directly reference CSS variables.
- **No dependency risk**: No charting library API to learn, no version mismatches, no security advisories.
- **Sufficient for scope**: The visualizations required (mini sparklines, single bar charts, outcome bars) are achievable in < 50 lines of SVG math per component.
