# Project Scope

## AI Revenue Recovery Agent

The goal of this project is to build an AI Revenue Recovery Agent for merchants. The system detects revenue at risk, creates recovery cases, uses AI to recommend a recovery strategy, validates that strategy against deterministic merchant policies, executes approved actions, observes outcomes, attributes recovered revenue, and records a complete audit trail.

### In Scope

1. **Event Ingestion:** Detecting failed payments, abandoned checkouts, or failed subscriptions.
2. **AI Strategy Selection:** Using a Gemini-based AI engine to analyze the failure reason and propose recovery actions.
3. **Policy Validation:** Ensuring AI-proposed actions adhere to predefined merchant rules (e.g., maximum retry attempts, discount limits).
4. **Action Execution:** Automatically executing actions such as `RETRY_PAYMENT`, `SEND_REMINDER`, `UPDATE_PAYMENT_METHOD`, or `OFFER_INCENTIVE`.
5. **Outcome Observation & Revenue Attribution:** Measuring the success of actions and linking recovered amounts directly or indirectly back to the recovery effort.
6. **Auditability:** Maintaining a robust chronological audit trail of all AI and system decisions.
7. **Merchant Dashboard (Frontend):** A rich, interactive React/Next.js dashboard to visualize at-risk revenue, AI insights, and recovery workflows.

### Out of Scope

1. **Direct AI Execution:** The AI model is strictly prohibited from executing arbitrary actions. It only outputs structured recommendations.
2. **Raw Payment Processing:** The system acts as an orchestrator and assumes integration with an external payment gateway for actual payment capture.
