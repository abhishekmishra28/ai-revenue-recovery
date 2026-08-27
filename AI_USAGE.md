# AI Usage & Guidelines

## Gemini Strategy Engine

This project utilizes Google's Gemini models for its core AI Strategy Engine.

### Purpose
The AI model is responsible for parsing failure contexts (e.g., "insufficient funds", "card expired") and proposing the highest probability recovery strategy.

### Constraints & Guardrails
- **No Direct Execution:** The AI model is strictly prevented from executing actions. Its sole output is a structured JSON proposal (`StrategyDecision`).
- **Policy Validation:** Every AI proposal must be evaluated by the Policy Engine. If the AI suggests `RETRY_PAYMENT` but the merchant's policy limits retries to 3 (and 3 have occurred), the policy engine rejects the action.
- **Auditability:** AI outputs, including the model version, prompt version, confidence score, and reasoning, are saved to the database as an `AuditEvent`.

### Supported AI Decisions
- `RETRY_PAYMENT`
- `SEND_REMINDER`
- `UPDATE_PAYMENT_METHOD`
- `OFFER_INCENTIVE`
- `NO_ACTION`

### Example Output
```json
{
  "tool": "gemini-recovery-engine",
  "model": "gemini-3.6-flash",
  "reason": "The payment failed due to insufficient funds, which is a transient failure eligible for retry.",
  "decision": "RETRY_PAYMENT",
  "riskLevel": "LOW",
  "confidence": "0.9",
  "promptVersion": "v3-gemini",
  "expectedRecovery": "3999"
}
```
