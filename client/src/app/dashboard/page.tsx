"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { calculateDashboardMetrics } from "@/lib/dashboard-metrics";
import type {
  RecoveryCase,
  StrategyDecision,
} from "@/types/recovery";

function formatCurrency(
  value: string | number | null | undefined,
  currency = "INR",
) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortId(value: string | null | undefined) {
  if (!value) return "—";
  return value.slice(0, 8);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "RECOVERED":
    case "SUCCEEDED":
    case "SUCCESS":
    case "VALIDATED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "FAILED":
    case "REJECTED":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "IN_PROGRESS":
    case "EXECUTING":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "PENDING":
    case "OPEN":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function getRiskClasses(risk: string) {
  switch (risk) {
    case "LOW":
      return "text-emerald-400";

    case "MEDIUM":
      return "text-amber-400";

    case "HIGH":
      return "text-orange-400";

    case "CRITICAL":
      return "text-red-400";

    default:
      return "text-slate-400";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
        status,
      )}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  positive = true,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  positive?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>

          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {value}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
          <Icon className="h-5 w-5 text-slate-300" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">{subtitle}</p>

        {trend && (
          <span
            className={`flex items-center gap-1 text-xs ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}

            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function RecoveryCaseRow({
  recoveryCase,
}: {
  recoveryCase: RecoveryCase;
}) {
  const amount = Number(
    recoveryCase.estimatedRecovery ?? 0,
  );

  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_1fr_0.8fr] items-center gap-4 border-b border-slate-800/80 px-5 py-4 text-sm last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
            <FileText className="h-4 w-4 text-slate-400" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-white">
              Case #{shortId(recoveryCase.id)}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              Transaction #
              {shortId(recoveryCase.transactionId)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-500">Case type</p>
        <p className="mt-1 truncate text-slate-300">
          {recoveryCase.caseType || "Payment Recovery"}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">Risk</p>

        <p
          className={`mt-1 text-xs font-semibold ${getRiskClasses(
            recoveryCase.riskLevel,
          )}`}
        >
          {recoveryCase.riskLevel}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">Priority</p>

        <p className="mt-1 text-xs font-medium text-slate-300">
          {recoveryCase.priority}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">Recovery</p>

        <p className="mt-1 font-medium text-white">
          {formatCurrency(amount, recoveryCase.currency)}
        </p>
      </div>

      <div>
        <StatusBadge status={recoveryCase.status} />
      </div>
    </div>
  );
}

function StrategyRow({
  decision,
}: {
  decision: StrategyDecision;
}) {
  return (
    <div className="border-b border-slate-800/80 px-5 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
            <Bot className="h-4 w-4 text-purple-400" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {decision.decision}
            </p>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {decision.reason}
            </p>
          </div>
        </div>

        <StatusBadge status={decision.status} />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Confidence:{" "}
          <span className="font-medium text-slate-300">
            {Number(decision.confidence) * 100}%
          </span>
        </span>

        <span>
          Risk:{" "}
          <span className={getRiskClasses(decision.riskLevel)}>
            {decision.riskLevel}
          </span>
        </span>
      </div>
    </div>
  );
}

function RecoveryPerformance({
  recoveryRate,
  successfulOutcomes,
  failedOutcomes,
}: {
  recoveryRate: number;
  successfulOutcomes: number;
  failedOutcomes: number;
}) {
  const total = successfulOutcomes + failedOutcomes;

  const successWidth =
    total > 0
      ? (successfulOutcomes / total) * 100
      : 0;

  const failedWidth =
    total > 0
      ? (failedOutcomes / total) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="font-semibold text-white">
            Recovery performance
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Outcome performance across recovery actions
          </p>
        </div>

        <TrendingUp className="h-5 w-5 text-slate-500" />
      </div>

      <div className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Overall recovery rate
            </p>

            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {recoveryRate.toFixed(1)}%
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">
              Total outcomes
            </p>

            <p className="mt-1 text-lg font-medium text-slate-200">
              {total}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${successWidth}%` }}
            />

            <div
              className="bg-red-500 transition-all"
              style={{ width: `${failedWidth}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                <span className="text-xs text-slate-500">
                  Successful
                </span>
              </div>

              <p className="mt-2 text-xl font-semibold text-white">
                {successfulOutcomes}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />

                <span className="text-xs text-slate-500">
                  Failed
                </span>
              </div>

              <p className="mt-2 text-xl font-semibold text-white">
                {failedOutcomes}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIOverview({
  totalStrategies,
  validatedStrategies,
  rejectedStrategies,
}: {
  totalStrategies: number;
  validatedStrategies: number;
  rejectedStrategies: number;
}) {
  const validationRate =
    totalStrategies > 0
      ? (validatedStrategies / totalStrategies) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="font-semibold text-white">
            AI strategy engine
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Decision generation and policy validation
          </p>
        </div>

        <Sparkles className="h-5 w-5 text-purple-400" />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-5">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-slate-800">
            <div className="absolute inset-[-8px] rounded-full border-8 border-transparent border-t-purple-500 border-r-purple-500" />

            <div className="text-center">
              <p className="text-xl font-semibold text-white">
                {validationRate.toFixed(0)}%
              </p>

              <p className="text-[10px] text-slate-500">
                validated
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Generated
              </span>

              <span className="font-medium text-white">
                {totalStrategies}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Validated
              </span>

              <span className="font-medium text-emerald-400">
                {validatedStrategies}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Rejected
              </span>

              <span className="font-medium text-red-400">
                {rejectedStrategies}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />

            <div>
              <p className="text-xs font-medium text-purple-300">
                Policy-controlled AI
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                AI decisions are validated against merchant
                recovery policies before an action can execute.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditTimeline({
  events,
}: {
  events: {
    id: string;
    eventType: string;
    actorType: string;
    createdAt: string;
    metadata: Record<string, unknown>;
  }[];
}) {
  const latestEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="font-semibold text-white">
            Recent audit activity
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Immutable recovery decision trail
          </p>
        </div>

        <Activity className="h-5 w-5 text-slate-500" />
      </div>

      <div className="divide-y divide-slate-800/70">
        {latestEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No audit events yet.
          </div>
        ) : (
          latestEvents.map((event) => (
            <div
              key={event.id}
              className="flex gap-4 px-5 py-4"
            >
              <div className="relative flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">
                    {event.eventType.replaceAll("_", " ")}
                  </p>

                  <span className="text-[10px] text-slate-600">
                    {formatDate(event.createdAt)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-500">
                    {event.actorType}
                  </span>

                  {typeof event.metadata?.decision ===
                    "string" && (
                    <span className="text-[10px] text-slate-500">
                      Decision:{" "}
                      <span className="text-slate-300">
                        {event.metadata.decision}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    recoveryCases,
    revenueEvents,
    strategyDecisions,
    outcomes,
    attributions,
    auditEvents,
    loading,
    error,
    refresh,
  } = useDashboardData();

  const metrics = calculateDashboardMetrics({
    recoveryCases,
    revenueEvents,
    strategyDecisions,
    outcomes,
    attributions,
    auditEvents,
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b12] text-white">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-lg bg-slate-800" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 rounded-2xl bg-slate-900"
                />
              ))}
            </div>

            <div className="h-80 rounded-2xl bg-slate-900" />

            <div className="h-96 rounded-2xl bg-slate-900" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b12] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>

          <h1 className="mt-5 text-lg font-semibold">
            Failed to load dashboard
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={refresh}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b12] text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  AI Revenue Recovery
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Intelligent payment recovery control center
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              <span className="text-xs font-medium text-emerald-400">
                System operational
              </span>
            </div>

            <button
              onClick={refresh}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </header>

        {/* METRICS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Recovered revenue"
            value={formatCurrency(metrics.recoveredRevenue)}
            subtitle="Attributed revenue"
            icon={CircleDollarSign}
            trend={`${metrics.recoveryRate.toFixed(1)}% recovery`}
          />

          <MetricCard
            title="Revenue at risk"
            value={formatCurrency(
              metrics.totalRevenueAtRisk,
            )}
            subtitle="Estimated recoverable amount"
            icon={Target}
          />

          <MetricCard
            title="Recovery cases"
            value={metrics.totalCases.toLocaleString("en-IN")}
            subtitle={`${metrics.openCases} currently open`}
            icon={Zap}
          />

          <MetricCard
            title="Recovery rate"
            value={`${metrics.recoveryRate.toFixed(1)}%`}
            subtitle={`${metrics.successfulOutcomes} successful outcomes`}
            icon={TrendingUp}
            positive={metrics.recoveryRate >= 50}
          />
        </section>

        {/* SECONDARY METRICS */}
        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Open cases
              </span>

              <Clock3 className="h-4 w-4 text-amber-400" />
            </div>

            <p className="mt-2 text-xl font-semibold text-white">
              {metrics.openCases}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                AI decisions
              </span>

              <Bot className="h-4 w-4 text-purple-400" />
            </div>

            <p className="mt-2 text-xl font-semibold text-white">
              {metrics.totalStrategies}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Successful actions
              </span>

              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>

            <p className="mt-2 text-xl font-semibold text-white">
              {metrics.successfulActions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Audit events
              </span>

              <FileText className="h-4 w-4 text-slate-400" />
            </div>

            <p className="mt-2 text-xl font-semibold text-white">
              {metrics.totalAuditEvents}
            </p>
          </div>
        </section>

        {/* PERFORMANCE + AI */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <RecoveryPerformance
            recoveryRate={metrics.recoveryRate}
            successfulOutcomes={
              metrics.successfulOutcomes
            }
            failedOutcomes={metrics.failedOutcomes}
          />

          <AIOverview
            totalStrategies={metrics.totalStrategies}
            validatedStrategies={
              metrics.validatedStrategies
            }
            rejectedStrategies={
              metrics.rejectedStrategies
            }
          />
        </section>

        {/* ACTIVE CASES */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 px-5 py-5 md:flex-row md:items-center">
            <div>
              <h2 className="font-semibold text-white">
                Recovery cases
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Live recovery pipeline across merchants
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400">
                {metrics.totalCases} total
              </span>

              <span className="rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-400">
                {metrics.openCases} open
              </span>
            </div>
          </div>

          {recoveryCases.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">
              No recovery cases found.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_1fr_0.8fr] gap-4 border-b border-slate-800 bg-slate-950/40 px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    <span>Recovery case</span>
                    <span>Type</span>
                    <span>Risk</span>
                    <span>Priority</span>
                    <span>Estimated recovery</span>
                    <span>Status</span>
                  </div>

                  {recoveryCases
                    .slice(0, 10)
                    .map((recoveryCase) => (
                      <RecoveryCaseRow
                        key={recoveryCase.id}
                        recoveryCase={recoveryCase}
                      />
                    ))}
                </div>
              </div>

              <div className="divide-y divide-slate-800/70 xl:hidden">
                {recoveryCases
                  .slice(0, 10)
                  .map((recoveryCase) => (
                    <div
                      key={recoveryCase.id}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Case #{shortId(recoveryCase.id)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Transaction #
                            {shortId(
                              recoveryCase.transactionId,
                            )}
                          </p>
                        </div>

                        <StatusBadge
                          status={recoveryCase.status}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Risk
                          </p>

                          <p
                            className={`mt-1 text-xs font-semibold ${getRiskClasses(
                              recoveryCase.riskLevel,
                            )}`}
                          >
                            {recoveryCase.riskLevel}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Recovery
                          </p>

                          <p className="mt-1 text-xs font-medium text-white">
                            {formatCurrency(
                              recoveryCase.estimatedRecovery,
                              recoveryCase.currency,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>

        {/* AI DECISIONS + AUDIT */}
        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">
                  Latest AI decisions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Decisions generated by the recovery engine
                </p>
              </div>

              <Bot className="h-5 w-5 text-purple-400" />
            </div>

            {strategyDecisions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No AI decisions found.
              </div>
            ) : (
              strategyDecisions
                .slice(0, 5)
                .map((decision) => (
                  <StrategyRow
                    key={decision.id}
                    decision={decision}
                  />
                ))
            )}

            {strategyDecisions.length > 5 && (
              <button className="flex w-full items-center justify-center gap-1 border-t border-slate-800 px-5 py-3 text-xs font-medium text-slate-500 transition hover:text-white">
                View all decisions
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <AuditTimeline events={auditEvents} />
        </section>

        {/* SYSTEM SUMMARY */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Recovery intelligence pipeline healthy
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {metrics.totalRevenueEvents} revenue events ·{" "}
                  {metrics.totalStrategies} AI decisions ·{" "}
                  {metrics.totalActions} outcomes ·{" "}
                  {metrics.totalAuditEvents} audit events
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}