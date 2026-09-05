# Project Scope

> This document defines the explicit boundaries of the RevivePay AI system — what it does, what it deliberately does not do, and the design principles that govern these decisions.

---

## Problem Statement

Online merchants operating in India and globally lose an estimated **5–15% of revenue** to recoverable events: card declines due to transient bank issues, customers abandoning checkout mid-session, and subscription renewals that fail due to expired payment methods. These are not permanent losses — they are *opportunities* that require fast, intelligent, and policy-compliant intervention.

RevivePay AI is an autonomous agent that detects these events, determines the optimal recovery action using AI, validates that action against merchant-defined rules, executes it, and attributes the recovered revenue back to the agent — all within seconds, at scale.

---

## In Scope

### 1. Revenue Event Ingestion

- Normalizing heterogeneous payment failure signals (CARD, UPI, NET_BANKING, WALLET) into a standard `RevenueEvent` schema.
- Supporting three primary event types:
  - `PAYMENT_FAILED` — Transaction declined by the payment gateway or issuing bank.
  - `CHECKOUT_ABANDONED` — Customer reached the payment page but did not complete the purchase.
  - `SUBSCRIPTION_PAYMENT_FAILED` — A recurring subscription renewal has failed.
- Idempotent event processing to handle duplicate webhook deliveries safely.

### 2. AI-Powered Strategy Generation

- Using **Google Gemini** to analyze each `RecoveryCase` context (failure reason, customer history, merchant configuration) and recommend the highest-probability recovery action.
- Producing a structured, schema-validated JSON decision with a confidence score and natural language reasoning for every case.
- Supporting the full decision taxonomy: `RETRY_PAYMENT`, `SEND_PAYMENT_REMINDER`, `SEND_SUBSCRIPTION_REMINDER`, `UPDATE_PAYMENT_METHOD`, `NO_ACTION`, `ESCALATE_TO_HUMAN`.

### 3. Deterministic Policy Enforcement

- Evaluating every AI recommendation against hard, merchant-configured rules before any action is executed.
- Enforced policies include:
  - Maximum retry attempts per transaction
  - Minimum cooldown period between contact attempts
  - Maximum transaction value for automatic retry
  - Allowed communication channels (EMAIL, SMS, PUSH)
  - Time-of-day restrictions for customer contact

### 4. Recovery Action Execution

- Creating and executing `RecoveryAction` records for approved strategies.
- Simulating provider integrations (Stripe, Razorpay, email/SMS providers) for recovery action execution.
- Recording the outcome (`RECOVERY_SUCCEEDED`, `RECOVERY_FAILED`) for each action.

### 5. Revenue Attribution

- Explicitly linking every successful recovery outcome back to the AI strategy that generated it.
- Computing the ROI of the AI agent: total revenue attributed vs. total events processed.
- Exposing attribution data via the dashboard and API for merchant reporting.

### 6. Complete Audit Trail

- Recording every pipeline step — event creation, AI decision, policy validation, action execution, outcome — as an immutable `AuditEvent` record.
- Providing full timeline visibility per recovery case in the dashboard.
- Storing the AI's exact `reason` and `confidence` score alongside the model version for every decision.

### 7. Interactive Demonstration Dashboard

- A premium dark-mode Next.js dashboard for merchants to monitor the AI's performance in real time.
- **Scenario Simulator** (`/simulate`): Inject any scenario and watch the full pipeline execute stage-by-stage with live animations.
- **Batch Runner** (`/batch`): Run up to 20 scenarios in sequence with configurable stopping rules, measuring aggregate recovery rates.
- **AI Decisions** view: Browse every AI strategy decision with confidence scores, risk levels, and natural language reasoning.
- **Audit Trail** view: Full immutable timeline for any recovery case.

---

## Out of Scope

These are deliberate exclusions — not missing features. Each exclusion is a design decision that makes the system safer, more auditable, and more maintainable.

### AI Cannot Execute Actions Directly

The AI module has no connection to payment gateways, email providers, or any external service. It outputs a structured JSON recommendation. The deterministic backend executes the action. This is a fundamental safety boundary (see [ADR-002](DECISION.md)).

### No Black-Box Decisions

Every AI decision must include a human-readable `reason` field and a `confidence` score. "The AI decided to retry" is never acceptable — "The AI decided to retry because the BANK_TIMEOUT failure code indicates a transient issuer issue, with 91% confidence" is the standard.

### No Direct Database Access for the AI

The AI is not a SQL agent. It receives a strictly bounded JSON payload of case context. It cannot query the database, access other merchants' data, or read beyond what the orchestrator explicitly provides.

### No Real Payment Processing in Demo Mode

The execution engine simulates provider responses (success/failure) rather than calling live payment gateway APIs. This is intentional for a demonstration system. The integration points (`action-execution` module) are designed to be replaced with real Stripe/Razorpay SDK calls in a production deployment.

### No Multi-Tenant Authentication

The current scope does not include a merchant authentication and authorization layer (JWT, OAuth, API keys). This is a deliberate scope reduction to focus on the core AI recovery pipeline. The architecture supports adding an auth middleware layer at the Express router level without changes to any domain module.

### No Real-Time Streaming

The pipeline is synchronous and request-response based. WebSocket streaming of pipeline progress is not in scope; the frontend achieves the "live" effect through staggered UI animations that reveal results as each stage completes.

### No Historical Trend Analysis

The dashboard shows current metrics and recent events. Long-term trend analytics (weekly/monthly recovery rate charts, cohort analysis) are out of scope for this release.

---

## Design Principles

These principles govern every scoping decision:

1. **Explicit over implicit**: Every AI decision, policy check, and outcome is recorded. Nothing happens in a black box.
2. **AI recommends, determinism executes**: No AI output ever directly triggers an external API call.
3. **Fail safe**: When uncertain, the system returns `NO_ACTION` rather than risking a bad intervention.
4. **Merchant control**: Merchants define the rules. The AI optimizes within those rules, not around them.
5. **Auditability first**: If a decision cannot be explained and logged, it should not be made.
