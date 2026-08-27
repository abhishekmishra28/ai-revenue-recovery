# AI Usage & Guardrails

We use **Google Gemini 3.6 Flash** for the `ai-strategy-engine`.

## Why Gemini Flash?
Revenue recovery requires high throughput and low latency. The AI needs to make split-second decisions on incoming webhooks before executing policies. Gemini Flash provides the perfect balance of reasoning capability and speed.

## The Prompt Structure
The system does not allow free-form generation. The prompt enforces a strict JSON schema output.

**Input:**
```json
{
  "recoveryCase": {
    "caseType": "FAILED_PAYMENT",
    "riskLevel": "MEDIUM",
    "estimatedRecovery": "2450.00"
  },
  "transaction": {
    "status": "DECLINED",
    "failureCode": "insufficient_funds"
  }
}
```

**Output schema:**
```json
{
  "decision": "RETRY_PAYMENT", 
  "confidence": 0.92,
  "reason": "Payment failed due to insufficient funds, which is often transient. Retry recommended after 24 hours.",
  "riskLevel": "LOW"
}
```

## Guardrails
1. **JSON Parsing & Validation:** The output is immediately parsed and validated against expected enums.
2. **Read-Only AI:** The AI module only returns the JSON above. It has no capability to execute HTTP requests or write to the database.
3. **Audit Tracking:** The exact model version (`gemini-3.6-flash`), prompt version, and the AI's natural language reasoning are saved to the `AuditEvent` table for every single decision.
