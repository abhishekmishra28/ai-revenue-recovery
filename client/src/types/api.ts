export type RecoveryCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RECOVERED"
  | "FAILED"
  | "CLOSED";

export type RecoveryCasePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RecoveryCaseRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type RecoveryCase = {
  id: string;
  merchantId: string;
  customerId: string;
  transactionId: string;
  revenueEventId: string;

  caseType: string;

  status: RecoveryCaseStatus;

  priority: RecoveryCasePriority;

  riskLevel: RecoveryCaseRiskLevel;

  estimatedRecovery: string;

  currency: string;

  openedAt: string;

  closedAt: string | null;

  createdAt: string;

  updatedAt: string;
};