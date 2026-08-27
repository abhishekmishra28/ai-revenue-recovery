# Project Scope

The AI Revenue Recovery Agent is designed to automate the recovery of lost revenue for online merchants. 

Because it operates in a financial context, the scope explicitly separates **Probabilistic AI** from **Deterministic Execution**.

## In Scope
- **Event Ingestion:** Normalising failed payments, abandoned checkouts, and failed subscriptions into a standard `RevenueEvent`.
- **AI Recommendation:** Using LLMs (Gemini) to parse the failure reason, historical context, and customer data to recommend the highest-probability recovery action.
- **Policy Enforcement:** Hard-coded, deterministic rules set by the merchant (e.g., "Never retry a payment more than 3 times", "Don't email between 10 PM and 6 AM").
- **Audit Trails:** Recording every step of the decision and execution process for complete transparency.
- **Attribution:** Proving the ROI of the agent by explicitly linking recovered funds to the agent's actions.

## Out of Scope
- **AI Execution:** The AI *cannot* execute API calls to payment gateways itself. It generates a structured JSON decision. The deterministic backend executes the API call.
- **Black-box Decision Making:** The AI must output its confidence score and its natural language reasoning for *why* it made a decision, which is exposed to the merchant.
- **Direct Database Access:** The AI is not a SQL agent. It is provided a strictly typed JSON payload of the case context in its prompt.
