# Architectural Decisions

## 1. Deterministic Validation Over Probabilistic Execution
**Context:** AI models can hallucinate or suggest actions outside of merchant constraints (e.g., offering a 50% discount instead of a 10% discount).
**Decision:** We implemented a strict Policy Engine layer between AI recommendation and Action Execution.
**Consequences:** This guarantees safety and compliance while leveraging AI solely for contextual reasoning and classification.

## 2. Advanced MVC / Domain-Driven Backend
**Context:** As a fintech application scales, a flat controller structure becomes unmanageable.
**Decision:** We adopted a modular structure under `/server/src/modules/` grouping routes, controllers, services, and repositories by domain entity (e.g., `recovery-cases`, `audit-events`).
**Consequences:** Easier testability, clear boundaries, and natural mapping to the database domain model.

## 3. Idempotency Keys
**Context:** Network retries could cause a recovery action (like billing a card) to happen multiple times.
**Decision:** All executions and revenue attributions require a unique idempotency key derived from the StrategyDecision.
**Consequences:** Eliminates the risk of double-charging or double-counting recovered revenue.
