"use client";

import { useEffect, useMemo, useState } from "react";

import RecoveryOverview from "@/components/dashboard/RecoveryOverview";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecoveryCasesTable from "@/components/dashboard/RecoveryCasesTable";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RevenueRecoveryChart from "@/components/dashboard/RevenueRecoveryChart";
import AIInsights from "@/components/dashboard/AIInsights";

import { api } from "@/lib/api";

import type {
  AuditEvent,
  RecoveryCase,
  RecoveryOutcome,
  RevenueAttribution,
} from "@/types/recovery";

const DEFAULT_CURRENCY = "INR";

export default function DashboardPage() {
  const [recoveryCases, setRecoveryCases] = useState<
    RecoveryCase[]
  >([]);

  const [outcomes, setOutcomes] = useState<
    RecoveryOutcome[]
  >([]);

  const [attributions, setAttributions] = useState<
    RevenueAttribution[]
  >([]);

  const [auditEvents, setAuditEvents] = useState<
    AuditEvent[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [
          recoveryCasesResponse,
          outcomesResponse,
          attributionResponse,
          auditResponse,
        ] = await Promise.all([
          api.recoveryCases.list(),
          api.outcomes.list(),
          api.revenueAttribution.list(),
          api.audit.all(),
        ]);

        if (cancelled) {
          return;
        }

        setRecoveryCases(
          recoveryCasesResponse.data ?? [],
        );

        setOutcomes(
          outcomesResponse.data ?? [],
        );

        setAttributions(
          attributionResponse.data ?? [],
        );

        setAuditEvents(
          auditResponse.data ?? [],
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load dashboard:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard data",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    let totalOpportunity = 0;
    let openOpportunity = 0;
    
    const totalCases = recoveryCases.length;
    let openCasesCount = 0;
    let recoveredCasesCount = 0;
    let failedCasesCount = 0;

    for (const recoveryCase of recoveryCases) {
      const amount = Number(
        recoveryCase.estimatedRecovery ?? 0,
      );

      totalOpportunity += amount;

      if (
        recoveryCase.status === "OPEN" ||
        recoveryCase.status === "IN_PROGRESS"
      ) {
        openOpportunity += amount;
        openCasesCount++;
      } else if (recoveryCase.status === "RECOVERED") {
        recoveredCasesCount++;
      } else if (recoveryCase.status === "FAILED") {
        failedCasesCount++;
      }
    }

    let recoveredAmount = 0;
    let failedAmount = 0;

    for (const outcome of outcomes) {
      const amount = Number(
        outcome.recoveredAmount ?? 0,
      );

      if (outcome.status === "SUCCESS") {
        recoveredAmount += amount;
      } else if (outcome.status === "FAILED") {
        failedAmount += amount;
      }
    }

    const recoveryRate =
      totalOpportunity > 0
        ? (recoveredAmount / totalOpportunity) * 100
        : 0;

    return {
      totalOpportunity,
      recoveredAmount,
      failedAmount,
      openOpportunity,
      recoveryRate,
      totalCases,
      openCases: openCasesCount,
      recoveredCases: recoveredCasesCount,
      failedCases: failedCasesCount,
    };
  }, [recoveryCases, outcomes]);

  const currency =
    recoveryCases[0]?.currency ??
    outcomes[0]?.currency ??
    DEFAULT_CURRENCY;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-900">
              Failed to load dashboard
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Dashboard Header */}
        <header>
          <p className="text-sm font-medium text-emerald-600">
            AI Revenue Recovery
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Recovery Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor recovery opportunities, AI decisions,
            actions, and recovered revenue.
          </p>
        </header>

        {/* KPI / Overview */}
        <RecoveryOverview
          totalCases={stats.totalCases}
          openCases={stats.openCases}
          recoveredCases={stats.recoveredCases}
          failedCases={stats.failedCases}
          recoveredRevenue={stats.recoveredAmount}
          currency={currency}
          loading={loading}
        />

        {/* Metrics */}
        <DashboardStats cases={recoveryCases} />

        {/* Revenue + AI */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RevenueRecoveryChart
            recoveryCases={recoveryCases}
            outcomes={outcomes}
            attributions={attributions}
          />

          <AIInsights
            recoveryCases={recoveryCases}
            auditEvents={auditEvents}
          />
        </div>

        {/* Recovery Cases */}
        <RecoveryCasesTable
          recoveryCases={recoveryCases}
        />

        {/* Activity */}
        <RecentActivity
          auditEvents={auditEvents}
        />
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>

      <div className="h-80 rounded-xl bg-white border border-slate-200" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 rounded-xl bg-white border border-slate-200" />
        <div className="h-28 rounded-xl bg-white border border-slate-200" />
        <div className="h-28 rounded-xl bg-white border border-slate-200" />
        <div className="h-28 rounded-xl bg-white border border-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-xl bg-white border border-slate-200" />
        <div className="h-80 rounded-xl bg-white border border-slate-200" />
      </div>

      <div className="h-96 rounded-xl bg-white border border-slate-200" />
    </div>
  );
}