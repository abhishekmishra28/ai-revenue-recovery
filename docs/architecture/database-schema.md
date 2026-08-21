# Database Architecture — AI Revenue Recovery

**Document Status:** Draft v1.0
**Phase:** Phase 4 — Database Architecture
**Purpose:** Define the PostgreSQL domain model before implementation.

---

## 1. Purpose

The database is the persistent source of truth for the AI Revenue Recovery system.

It must support the complete recovery lifecycle:

```text
Revenue Event
      ↓
Transaction
      ↓
Recovery Case
      ↓
AI Strategy Decision
      ↓
Recovery Action
      ↓
Outcome
      ↓
Revenue Attribution
```

The database must also provide complete auditability of important system decisions and actions.

The schema is designed for the initial modular-monolith architecture and should remain suitable for later horizontal scaling if individual processing components are extracted.

---

## 2. Core Design Principles

### 2.1 PostgreSQL as the source of truth

PostgreSQL stores all persistent business state.

Redis is not treated as the system of record. It will initially support:

* idempotency
* short-lived caching
* temporary locks
* rate limiting where required

---

### 2.2 Financial precision

Financial values must never use floating-point database types.

Monetary values use:

```text
NUMERIC(18,2)
```

Every monetary value must have an associated currency.

Example:

```text
amount:   2499.00
currency: INR
```

---

### 2.3 UUID identifiers

Externally exposed domain entities use UUID identifiers.

This avoids exposing sequential database IDs and makes identifiers safer for future distributed processing.

---

### 2.4 Controlled state

Business states use explicit enums rather than unrestricted strings whenever the state space is known.

This prevents invalid states from entering the database.

---

### 2.5 Auditability

Important decisions and actions must be traceable.

For a recovery case, the system should eventually answer:

1. What event created the case?
2. What transaction was involved?
3. What risk was detected?
4. What did the AI recommend?
5. What evidence supported the recommendation?
6. Was the recommendation valid?
7. Was the action permitted by policy?
8. What action was executed?
9. What was the result?
10. How much revenue was recovered?

---

## 3. Core Entities

The initial database contains the following domain entities:

```text
Merchant
Customer
Transaction
RevenueEvent
RecoveryCase
AIStrategyDecision
RecoveryAction
Policy
Outcome
RevenueAttribution
AuditEvent
```

---

# 4. Merchant

Represents a business using the revenue recovery system.

### Important fields

```text
id
name
status
defaultCurrency
createdAt
updatedAt
```

### Relationships

```text
Merchant
 ├── Customers
 ├── Transactions
 ├── RevenueEvents
 ├── RecoveryCases
 ├── Policies
 └── AuditEvents
```

A merchant is the primary tenant boundary for the application.

All merchant-owned data must be associated with a merchant.

---

# 5. Customer

Represents a customer belonging to a merchant.

### Important fields

```text
id
merchantId
externalCustomerId
email
name
createdAt
updatedAt
```

`externalCustomerId` represents the customer's identifier in the merchant's payment system.

### Relationships

```text
Merchant
   │
   └── Customer
           │
           ├── Transactions
           └── RecoveryCases
```

The combination of:

```text
merchantId + externalCustomerId
```

should be unique.

---

# 6. Transaction

Represents a payment or payment attempt.

This is one of the central entities in the recovery system.

### Important fields

```text
id
merchantId
customerId
externalTransactionId
amount
currency
status
paymentMethod
failureCode
failureReason
occurredAt
createdAt
updatedAt
```

### Transaction status

Initial state set:

```text
PENDING
SUCCEEDED
FAILED
CANCELLED
REFUNDED
```

### Payment method

Initial supported categories:

```text
CARD
UPI
NET_BANKING
WALLET
OTHER
```

The model should remain extensible for additional payment methods.

---

# 7. RevenueEvent

Represents an event entering the revenue recovery system.

Examples:

```text
PAYMENT_FAILED
PAYMENT_SUCCEEDED
CHECKOUT_ABANDONED
SUBSCRIPTION_PAYMENT_FAILED
SUBSCRIPTION_RENEWED
```

### Important fields

```text
id
merchantId
transactionId
customerId
eventType
externalEventId
payload
occurredAt
processedAt
createdAt
```

`payload` may contain event-specific information that does not justify creating dedicated columns.

However, important fields used for filtering, decisions, or analytics should remain normalized.

### Idempotency

`externalEventId` should be unique within the merchant boundary.

This prevents duplicate processing of the same incoming event.

---

# 8. RecoveryCase

Represents a revenue recovery opportunity created from a revenue event.

A case is the central business workflow object.

### Important fields

```text
id
merchantId
customerId
transactionId
revenueEventId
caseType
status
priority
riskLevel
estimatedRecovery
openedAt
closedAt
createdAt
updatedAt
```

### Case types

```text
FAILED_PAYMENT
CHECKOUT_ABANDONMENT
SUBSCRIPTION_FAILURE
```

### Case status

```text
OPEN
IN_PROGRESS
RECOVERED
FAILED
CLOSED
```

### Priority

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### Risk level

```text
LOW
MEDIUM
HIGH
```

A recovery case must have enough information to reproduce the recovery decision independently of the original event payload.

---

# 9. AI Strategy Decision

Represents the structured recommendation generated by the AI layer.

The AI must not directly execute financial actions.

### Important fields

```text
id
recoveryCaseId
decision
confidence
reason
evidence
expectedRecovery
riskLevel
tool
parameters
model
promptVersion
status
createdAt
```

### Decision

The decision should correspond to an allowed recovery strategy.

Initial strategies:

```text
RETRY_PAYMENT
SEND_PAYMENT_REMINDER
REQUEST_PAYMENT_METHOD_UPDATE
SEND_CHECKOUT_REMINDER
OFFER_RECOVERY_INCENTIVE
NO_ACTION
```

### Confidence

Stored as a numeric value between:

```text
0.0 and 1.0
```

Database/application validation must reject values outside this range.

### Evidence

Evidence should identify the relevant signals used by the model.

Example conceptual structure:

```json
[
  {
    "signal": "failure_code",
    "value": "expired_card",
    "relevance": "high"
  }
]
```

### Tool parameters

The structured parameters required by the selected tool are stored separately from the natural-language reasoning.

This allows deterministic validation before execution.

---

# 10. RecoveryAction

Represents an action that the system attempted or executed.

The action is separate from the AI recommendation.

This distinction is critical.

```text
AI Recommendation
        ↓
Validation
        ↓
Policy Decision
        ↓
Recovery Action
```

### Important fields

```text
id
recoveryCaseId
strategyDecisionId
actionType
status
idempotencyKey
parameters
executedAt
completedAt
errorCode
errorMessage
createdAt
updatedAt
```

### Action status

```text
PENDING
VALIDATED
REJECTED
EXECUTING
SUCCEEDED
FAILED
SKIPPED
```

An action must have an idempotency key.

This prevents duplicate financial operations when requests are retried.

---

# 11. Policy

Represents merchant-defined constraints governing recovery actions.

Policies are deterministic.

The AI cannot override them.

### Important fields

```text
id
merchantId
name
actionType
enabled
maxAmount
maxAttempts
cooldownSeconds
configuration
createdAt
updatedAt
```

Example:

```text
Action: RETRY_PAYMENT
Maximum attempts: 2
Cooldown: 3600 seconds
Enabled: true
```

The exact policy configuration format will be finalized during policy-engine implementation.

---

# 12. Outcome

Represents what happened after a recovery action.

### Important fields

```text
id
recoveryCaseId
recoveryActionId
status
failureReason
recoveredAmount
currency
occurredAt
createdAt
```

### Outcome status

```text
SUCCESS
PARTIAL_SUCCESS
FAILED
NO_CHANGE
```

An outcome records the real-world result rather than what the AI expected to happen.

---

# 13. RevenueAttribution

Represents revenue attributed to a recovery effort.

This is intentionally separate from `Outcome`.

An action can succeed technically without necessarily producing recoverable revenue.

Example:

```text
Action:
Payment reminder sent

Outcome:
Message delivered

Revenue Attribution:
₹2,499 recovered 18 hours later
```

### Important fields

```text
id
recoveryCaseId
outcomeId
amount
currency
attributionType
attributedAt
createdAt
```

### Attribution type

Initial model:

```text
DIRECT
ASSISTED
```

The attribution methodology will be documented and evaluated separately.

---

# 14. AuditEvent

Represents an immutable record of important system activity.

Audit records should be append-only.

### Important fields

```text
id
merchantId
recoveryCaseId
eventType
actorType
actorId
metadata
createdAt
```

### Actor types

```text
SYSTEM
AI
MERCHANT
ADMIN
```

Examples of audit events:

```text
RECOVERY_CASE_CREATED
AI_DECISION_GENERATED
AI_DECISION_VALIDATED
POLICY_APPROVED
POLICY_REJECTED
ACTION_STARTED
ACTION_SUCCEEDED
ACTION_FAILED
OUTCOME_RECORDED
REVENUE_ATTRIBUTED
```

The audit system should never rely exclusively on application logs.

Logs help operational debugging; audit events provide business-level traceability.

---

# 15. Relationships

The primary relationships are:

```text
Merchant
 ├── Customer
 ├── Transaction
 ├── RevenueEvent
 ├── RecoveryCase
 ├── Policy
 └── AuditEvent

Customer
 ├── Transaction
 └── RecoveryCase

Transaction
 ├── RevenueEvent
 └── RecoveryCase

RevenueEvent
 └── RecoveryCase

RecoveryCase
 ├── AIStrategyDecision
 ├── RecoveryAction
 ├── Outcome
 ├── RevenueAttribution
 └── AuditEvent

AIStrategyDecision
 └── RecoveryAction

RecoveryAction
 └── Outcome

Outcome
 └── RevenueAttribution
```

---

# 16. Important Constraints

The database should enforce the following constraints where practical.

### Merchant isolation

Every tenant-owned record must contain `merchantId`.

### Unique external identifiers

Examples:

```text
Merchant + externalCustomerId
Merchant + externalTransactionId
Merchant + externalEventId
```

must be unique.

### Monetary constraints

Amounts cannot be negative unless explicitly required by a future refund/adjustment model.

### Confidence

AI confidence must satisfy:

```text
0.0 <= confidence <= 1.0
```

### Idempotency

Recovery actions require unique idempotency keys.

### Referential integrity

Foreign-key relationships must prevent orphaned business records.

### Audit integrity

Audit records should remain immutable after creation.

---

# 17. Indexing Strategy

Initial indexes should focus on operational queries.

### Transactions

```text
merchantId
customerId
status
occurredAt
```

### Revenue events

```text
merchantId + externalEventId
merchantId + eventType
merchantId + occurredAt
```

### Recovery cases

```text
merchantId + status
merchantId + priority
merchantId + createdAt
customerId
transactionId
```

### Recovery actions

```text
recoveryCaseId
status
idempotencyKey
createdAt
```

### Outcomes

```text
recoveryCaseId
status
occurredAt
```

### Audit events

```text
merchantId + createdAt
recoveryCaseId + createdAt
eventType
```

Indexes will be reviewed after actual query patterns are implemented.

We should avoid premature indexing of every column.

---

# 18. Data Lifecycle

The expected lifecycle is:

```text
EVENT RECEIVED
      ↓
EVENT STORED
      ↓
RECOVERY CASE CREATED
      ↓
RISK ASSESSED
      ↓
AI STRATEGY GENERATED
      ↓
STRATEGY VALIDATED
      ↓
POLICY EVALUATED
      ↓
ACTION CREATED
      ↓
ACTION EXECUTED
      ↓
OUTCOME RECORDED
      ↓
REVENUE ATTRIBUTED
      ↓
CASE CLOSED
```

Every important transition should be observable through the audit trail.

---

# 19. Idempotency Model

Duplicate events and retries are expected in payment systems.

The system therefore treats idempotency as a first-class requirement.

For incoming events:

```text
merchantId + externalEventId
```

identifies the logical event.

For recovery actions:

```text
idempotencyKey
```

identifies the logical execution attempt.

The database provides uniqueness guarantees while Redis may provide fast short-lived duplicate detection.

The database remains the authoritative source.

---

# 20. AI Safety Boundary

The database model intentionally separates:

```text
AIStrategyDecision
        ↓
RecoveryAction
```

This prevents an AI recommendation from being treated as an executed action.

The execution pipeline is:

```text
AI Decision
     ↓
Schema Validation
     ↓
Tool Allowlist
     ↓
Policy Evaluation
     ↓
Idempotency Check
     ↓
Recovery Action
```

The database must preserve enough information to reconstruct this sequence.

---

# 21. Evaluation Requirements

The schema must support evaluation of the recovery system.

At minimum, we need to calculate:

```text
Total recovery cases
Successful recoveries
Failed recoveries
Policy rejections
Invalid AI recommendations
Actions executed
Actions skipped
Revenue recovered
Expected recovery
Actual recovery
```

This allows the evaluation system to compare AI recommendations with actual outcomes.

No performance metric should be stored as a manually fabricated value.

Metrics must be derived from recorded events, actions, and outcomes.

---

# 22. Future Extensibility

The initial schema is intentionally designed for the MVP.

Potential future additions include:

```text
Subscription
PaymentMethod
Experiment
Incentive
Notification
ModelEvaluation
PromptVersion
RecoveryAttempt
WebhookDelivery
```

These should only be introduced when required by actual product functionality.

The MVP schema should not be overloaded with speculative entities.

---

# 23. Database Implementation Order

The implementation should follow this sequence:

```text
1. Finalize this domain model
        ↓
2. Create Prisma schema
        ↓
3. Configure PostgreSQL connection
        ↓
4. Generate initial migration
        ↓
5. Apply migration locally
        ↓
6. Verify database constraints
        ↓
7. Create synthetic seed data
        ↓
8. Verify relationships and queries
        ↓
9. Commit schema + migration
```

The database architecture document is the source of truth for the initial Prisma implementation.

Changes to the schema after implementation should be documented through migration history and, where architecturally significant, an ADR.

---

## 24. Current Decision

**Database:** PostgreSQL 17
**ORM:** Prisma
**Primary source of truth:** PostgreSQL
**Cache/idempotency support:** Redis
**Financial type:** `NUMERIC(18,2)`
**Identifiers:** UUID
**Tenant boundary:** Merchant
**Audit model:** Append-only audit events
**Architecture:** Modular monolith
**Schema status:** v1.0 — implementation pending
