import type {
  AuditEvent,
  RecoveryCase,
  RecoveryOutcome,
  RevenueAttribution,
  RevenueEvent,
  StrategyDecision,
} from "@/types/recovery";

export type DashboardMetrics = {
  totalCases: number;
  openCases: number;
  inProgressCases: number;
  recoveredCases: number;
  failedCases: number;

  totalRevenueAtRisk: number;
  recoveredRevenue: number;

  totalActions: number;
  successfulActions: number;
  failedActions: number;

  totalStrategies: number;
  validatedStrategies: number;
  rejectedStrategies: number;

  totalOutcomes: number;
  successfulOutcomes: number;
  failedOutcomes: number;

  recoveryRate: number;
  actionSuccessRate: number;

  totalAuditEvents: number;
  totalRevenueEvents: number;
};

const money = (value: string | number | null | undefined) =>
  Number(value ?? 0);

export function calculateDashboardMetrics({
  recoveryCases,
  revenueEvents,
  strategyDecisions,
  outcomes,
  attributions,
  auditEvents,
}: {
  recoveryCases: RecoveryCase[];
  revenueEvents: RevenueEvent[];
  strategyDecisions: StrategyDecision[];
  outcomes: RecoveryOutcome[];
  attributions: RevenueAttribution[];
  auditEvents: AuditEvent[];
}): DashboardMetrics {
  const openCases = recoveryCases.filter(
    (item) => item.status === "OPEN",
  ).length;

  const inProgressCases = recoveryCases.filter(
    (item) => item.status === "IN_PROGRESS",
  ).length;

  const recoveredCases = recoveryCases.filter(
    (item) => item.status === "RECOVERED",
  ).length;

  const failedCases = recoveryCases.filter(
    (item) => item.status === "FAILED",
  ).length;

  const totalRevenueAtRisk = recoveryCases.reduce(
    (total, item) =>
      total + money(item.estimatedRecovery),
    0,
  );

  const recoveredRevenue = attributions.reduce(
    (total, item) =>
      total + money(item.amount),
    0,
  );

  const successfulActions = outcomes.filter(
    (item) => item.status === "SUCCESS",
  ).length;

  const failedActions = outcomes.filter(
    (item) => item.status === "FAILED",
  ).length;

  const validatedStrategies = strategyDecisions.filter(
    (item) => item.status === "VALIDATED",
  ).length;

  const rejectedStrategies = strategyDecisions.filter(
    (item) => item.status === "REJECTED",
  ).length;

  const successfulOutcomes = outcomes.filter(
    (item) => item.status === "SUCCESS",
  ).length;

  const failedOutcomes = outcomes.filter(
    (item) => item.status === "FAILED",
  ).length;

  const recoveryRate =
    outcomes.length > 0
      ? (successfulOutcomes / outcomes.length) * 100
      : 0;

  const actionSuccessRate =
    outcomes.length > 0
      ? (successfulActions / outcomes.length) * 100
      : 0;

  return {
    totalCases: recoveryCases.length,

    openCases,

    inProgressCases,

    recoveredCases,

    failedCases,

    totalRevenueAtRisk,

    recoveredRevenue,

    totalActions: outcomes.length,

    successfulActions,

    failedActions,

    totalStrategies: strategyDecisions.length,

    validatedStrategies,

    rejectedStrategies,

    totalOutcomes: outcomes.length,

    successfulOutcomes,

    failedOutcomes,

    recoveryRate,

    actionSuccessRate,

    totalAuditEvents: auditEvents.length,

    totalRevenueEvents: revenueEvents.length,
  };
}