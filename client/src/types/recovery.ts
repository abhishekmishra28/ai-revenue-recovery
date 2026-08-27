export type RecoveryCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RECOVERED"
  | "FAILED"
  | "CLOSED";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type Priority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type StrategyDecisionType =
  | "RETRY_PAYMENT"
  | "SEND_REMINDER"
  | "UPDATE_PAYMENT_METHOD"
  | "OFFER_INCENTIVE"
  | "NO_ACTION";

export type StrategyStatus =
  | "PENDING"
  | "VALIDATED"
  | "REJECTED";

export type RecoveryActionStatus =
  | "PENDING"
  | "EXECUTING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type OutcomeStatus =
  | "SUCCESS"
  | "FAILED";

export type AttributionType =
  | "DIRECT"
  | "INDIRECT";

export type ActorType =
  | "AI"
  | "SYSTEM"
  | "MERCHANT"
  | "USER";

export interface RevenueEvent {
  id: string;
  merchantId: string;
  transactionId: string | null;
  customerId: string | null;
  eventType: string;
  processedAt: string | null;
  createdAt?: string;
  payload?: Record<string, unknown>;
}

export interface StrategyDecision {
  id: string;
  recoveryCaseId: string;

  decision: StrategyDecisionType | string;

  confidence: string | number;

  reason: string;

  evidence?: Record<string, unknown>;

  expectedRecovery: string | number | null;

  riskLevel: RiskLevel;

  tool: string | null;

  parameters?: Record<string, unknown>;

  model: string | null;

  promptVersion: string | null;

  status: StrategyStatus;

  createdAt: string;
}

export interface RecoveryAction {
  id: string;

  recoveryCaseId: string;

  strategyDecisionId: string;

  actionType: string;

  status: RecoveryActionStatus;

  idempotencyKey: string;

  parameters?: Record<string, unknown>;

  executedAt: string | null;

  completedAt: string | null;

  errorCode: string | null;

  errorMessage: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface RecoveryOutcome {
  id: string;

  recoveryCaseId: string;

  recoveryActionId: string;

  status: OutcomeStatus;

  failureReason: string | null;

  recoveredAmount: string | number | null;

  currency: string;

  occurredAt: string;

  createdAt: string;
}

export interface RevenueAttribution {
  id: string;

  recoveryCaseId: string;

  outcomeId: string;

  amount: string | number;

  currency: string;

  attributionType: AttributionType;

  attributedAt: string;

  createdAt: string;
}

export interface AuditEvent {
  id: string;

  merchantId: string;

  recoveryCaseId: string | null;

  eventType: string;

  actorType: ActorType;

  actorId: string | null;

  metadata: Record<string, unknown>;

  createdAt: string;
}

export interface RecoveryCase {
  id: string;

  merchantId: string;

  customerId: string | null;

  transactionId: string | null;

  revenueEventId: string | null;

  caseType: string;

  status: RecoveryCaseStatus;

  priority: Priority;

  riskLevel: RiskLevel;

  estimatedRecovery: string | number | null;

  currency: string;

  openedAt: string;

  closedAt: string | null;

  createdAt: string;

  updatedAt: string;

  strategyDecisions?: StrategyDecision[];

  recoveryActions?: RecoveryAction[];

  outcomes?: RecoveryOutcome[];

  attributions?: RevenueAttribution[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
}