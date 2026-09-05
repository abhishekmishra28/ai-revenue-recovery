# AI Usage & Transparency Report

> **RevivePay AI** uses Generative AI as a **recommender**, not an executor. Every AI decision is sandboxed, validated, and made fully auditable before any financial action is taken.

---

## Model Selection

| Attribute       | Value                        |
|-----------------|------------------------------|
| **Provider**    | Google AI                    |
| **Model**       | `gemini-2.0-flash`           |
| **SDK**         | `@google/genai` v2.x         |
| **Invocation**  | Single-turn, structured JSON |
| **Latency**     | ~400–800ms per inference     |

### Why Gemini Flash?

Revenue recovery operates on real-time payment webhook events. When a customer's card declines at midnight, the system has a narrow window (typically minutes) to initiate a recovery action before the customer moves on. This demands:

- **High Throughput**: Flash handles concurrent webhook bursts without queue buildup.
- **Low Latency**: Sub-second inference keeps the pipeline well under the 2-second SLA.
- **Strong JSON Compliance**: Flash reliably produces valid, schema-conformant JSON — critical when the output is parsed by a deterministic policy engine.
- **Cost Efficiency**: For high-volume SaaS merchants, inference cost per event is a key metric. Flash provides enterprise-grade reasoning at a fraction of the cost of larger models.

---

## How the AI Is Used

The AI is invoked at exactly **one point** in the recovery pipeline: the **AI Strategy Engine** (`server/src/modules/ai-strategy-engine/`).

### Input: Structured Case Context

The AI receives a strictly typed JSON payload. It has **no access to the database, no tool calls, and no ability to make HTTP requests**. It only receives what the orchestrator explicitly provides:

```json
{
  "recoveryCase": {
    "id": "crs_01j...",
    "caseType": "FAILED_PAYMENT",
    "priority": "HIGH",
    "riskLevel": "MEDIUM",
    "estimatedRecovery": "2499.00",
    "currency": "INR",
    "failureReason": "BANK_TIMEOUT",
    "paymentMethod": "CARD",
    "retryCount": 0
  },
  "customer": {
    "historicalSuccessRate": 0.87,
    "lifetimeValue": "48500.00",
    "preferredChannel": "EMAIL"
  },
  "merchant": {
    "name": "TechCorp India",
    "cooldownHours": 4,
    "maxRetryAttempts": 3,
    "allowedChannels": ["EMAIL", "SMS", "PUSH"]
  }
}
```

### System Prompt Design

The system prompt enforces:
1. **Role constraints** — "You are a financial recovery strategy engine. Your sole output is a JSON object."
2. **Schema enforcement** — The exact JSON schema is embedded in the prompt, including every valid enum value.
3. **Reasoning requirement** — The AI must articulate *why* it chose a strategy in plain language, stored in the `reason` field.
4. **Confidence calibration** — The AI must output a confidence score (0.0–1.0) representing its certainty.

### Output: Structured JSON Decision

```json
{
  "decision": "RETRY_PAYMENT",
  "confidence": 0.91,
  "riskLevel": "LOW",
  "reason": "BANK_TIMEOUT failures are transient infrastructure issues, not indicative of customer credit problems. With a 87% historical success rate and 0 prior retries, a single retry after a 4-hour cooldown has a high probability of recovery.",
  "model": "gemini-2.0-flash"
}
```

**Valid `decision` values:**
| Decision                | Trigger Condition                              |
|-------------------------|------------------------------------------------|
| `RETRY_PAYMENT`         | Transient failure (timeout, bank offline)      |
| `SEND_PAYMENT_REMINDER` | Abandoned checkout or low-urgency failure      |
| `SEND_SUBSCRIPTION_REMINDER` | Subscription payment lapse                |
| `UPDATE_PAYMENT_METHOD` | Card expired or blocked                        |
| `NO_ACTION`             | Risk too high or policy would reject anyway    |
| `ESCALATE_TO_HUMAN`     | Complex case requiring manual intervention     |

---

## Safety & Guardrails

The AI **cannot** cause harm because it has zero execution capability. Every output is subject to multiple layers of control:

### Layer 1 — Read-Only AI

The AI module has no database connection, no HTTP client, and no file system access. It is a pure function: `(JSON context) → (JSON decision)`. If the AI's output is malformed JSON, it throws a parse error and the pipeline halts.

### Layer 2 — Schema Validation

Immediately after the AI responds, the strategy engine validates:
- `decision` is one of the six allowed enum values
- `confidence` is a float between 0.0 and 1.0
- `riskLevel` is `LOW`, `MEDIUM`, or `HIGH`
- `reason` is a non-empty string

Any schema violation causes the pipeline to stop with a `POLICY_REJECTED` status.

### Layer 3 — Deterministic Policy Engine

Even if the AI produces a valid, well-reasoned strategy, the **Policy Engine** (`server/src/modules/policy-engine/`) independently evaluates hard merchant-defined rules:

| Rule                    | Example                                              |
|-------------------------|------------------------------------------------------|
| Max retry limit         | Never retry a payment more than 3 times              |
| Cooldown enforcement    | No contact within 4 hours of last attempt            |
| Value ceiling           | Don't retry transactions above ₹50,000 automatically |
| Time-of-day restrictions| No SMS between 10 PM and 7 AM                        |

The Policy Engine can **reject** any AI strategy regardless of its confidence score. The AI recommends; deterministic rules govern.

### Layer 4 — Complete Audit Trail

Every AI invocation is recorded in the `AuditEvent` table with:
- Exact model version (e.g., `gemini-2.0-flash`)
- Full input payload hash
- Raw AI output (before parsing)
- Parsed decision and confidence score
- Policy validation result
- Timestamp with millisecond precision

This audit trail is immutable and exposed via the **AI Decisions** tab of the dashboard.

---

## Token Usage & Cost Management

To keep inference costs predictable:
- Context payloads are trimmed to the **minimum required fields** — no full transaction histories, no raw webhook bodies.
- The prompt is versioned (`v1`) and cached in memory; only the case-specific JSON changes per call.
- Long `reason` fields are truncated to 500 characters before storage to control database growth.

---

## What AI Does NOT Do

| Prohibited Action                | Enforcement Mechanism                        |
|----------------------------------|----------------------------------------------|
| Execute payment retries directly | AI module has no payment gateway credentials |
| Access the database              | AI module has no Prisma/DB connection        |
| Make HTTP calls                  | Completely absent from the module's imports  |
| Remember previous interactions   | Stateless single-turn prompt; no conversation history |
| Make decisions above policy limits | Policy Engine rejects these deterministically |
