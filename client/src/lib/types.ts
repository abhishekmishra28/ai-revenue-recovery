export interface Merchant {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  merchantId: string;
  externalCustomerId: string;
  email?: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  merchantId: string;
  customerId: string;
  externalTransactionId: string;
  amount: string;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED";
  paymentMethod: "CARD" | "UPI" | "NET_BANKING" | "WALLET" | "OTHER";
  failureCode?: string;
  failureReason?: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueEvent {
  id: string;
  merchantId: string;
  transactionId?: string;
  customerId?: string;
  eventType:
    | "PAYMENT_FAILED"
    | "PAYMENT_SUCCEEDED"
    | "CHECKOUT_ABANDONED"
    | "SUBSCRIPTION_PAYMENT_FAILED"
    | "SUBSCRIPTION_RENEWED";
  externalEventId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  processedAt?: string;
  createdAt: string;
}

export interface RecoveryCase {
  id: string;
  merchantId: string;
  customerId?: string;
  transactionId?: string;
  revenueEventId?: string;
  caseType: "FAILED_PAYMENT" | "CHECKOUT_ABANDONMENT" | "SUBSCRIPTION_FAILURE";
  status: "OPEN" | "IN_PROGRESS" | "RECOVERED" | "FAILED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  estimatedRecovery?: string;
  currency: string;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIStrategyDecision {
  id: string;
  recoveryCaseId: string;
  decision:
    | "RETRY_PAYMENT"
    | "SEND_PAYMENT_REMINDER"
    | "REQUEST_PAYMENT_METHOD_UPDATE"
    | "SEND_CHECKOUT_REMINDER"
    | "OFFER_RECOVERY_INCENTIVE"
    | "NO_ACTION";
  confidence: string;
  reason: string;
  evidence: Record<string, unknown>;
  expectedRecovery?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  tool?: string;
  parameters?: Record<string, unknown>;
  model: string;
  promptVersion: string;
  status: "GENERATED" | "VALIDATED" | "REJECTED";
  createdAt: string;
}

export interface RecoveryAction {
  id: string;
  recoveryCaseId: string;
  strategyDecisionId?: string;
  actionType: string;
  status:
    | "PENDING"
    | "VALIDATED"
    | "REJECTED"
    | "EXECUTING"
    | "SUCCEEDED"
    | "FAILED"
    | "SKIPPED";
  idempotencyKey: string;
  parameters?: Record<string, unknown>;
  executedAt?: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Outcome {
  id: string;
  recoveryCaseId: string;
  recoveryActionId: string;
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED" | "NO_CHANGE";
  failureReason?: string;
  recoveredAmount?: string;
  currency: string;
  occurredAt: string;
  createdAt: string;
}

export interface RevenueAttribution {
  id: string;
  recoveryCaseId: string;
  outcomeId: string;
  amount: string;
  currency: string;
  attributionType: "DIRECT" | "ASSISTED";
  attributedAt: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  merchantId: string;
  recoveryCaseId?: string;
  eventType: string;
  actorType: "SYSTEM" | "AI" | "MERCHANT" | "ADMIN";
  actorId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RecoveryPipelineResponse {
  status:
    | "ALREADY_PROCESSED"
    | "NO_RECOVERY_REQUIRED"
    | "POLICY_REJECTED"
    | "RECOVERY_SUCCEEDED"
    | "RECOVERY_FAILED";
  event?: RevenueEvent;
  recoveryCase?: RecoveryCase;
  strategyDecision?: AIStrategyDecision;
  validatedDecision?: AIStrategyDecision;
  recoveryAction?: RecoveryAction;
  outcome?: Outcome;
  attribution?: RevenueAttribution;
}

export interface HealthStatus {
  status: string;
  database?: string;
  timestamp?: string;
}
