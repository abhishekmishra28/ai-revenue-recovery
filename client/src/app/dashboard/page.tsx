"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import MetricCards from "@/components/dashboard/MetricCards";
import RevenueRecoveryCard from "@/components/dashboard/RevenueRecoveryCard";
import RecoveryByWorkflow from "@/components/dashboard/RecoveryByWorkflow";
import RecoveryCasesTable from "@/components/dashboard/RecoveryCasesTable";
import RecentAuditEvents from "@/components/dashboard/RecentAuditEvents";
import CaseDetailPanel from "@/components/dashboard/CaseDetailPanel";
import HowItWorksSection from "@/components/dashboard/HowItWorksSection";

import { api } from "@/lib/api";

import type {
  AuditEvent,
  RecoveryCase,
  RecoveryOutcome,
  RevenueAttribution,
} from "@/types/recovery";

import AIInsights from "@/components/dashboard/AIInsights";

// ──────────────────────────────────────────────────────────
// Dashboard page
//
// Loads all data up front, computes aggregate metrics, and
// passes them down into the purpose-built display components.
// Nothing clever happens here — this is purely orchestration.
// ──────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = "INR";

export default function DashboardPage() {
  const [recoveryCases, setRecoveryCases] = useState<RecoveryCase[]>([]);
  const [outcomes, setOutcomes] = useState<RecoveryOutcome[]>([]);
  const [attributions, setAttributions] = useState<RevenueAttribution[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which recovery case has been selected (for the side panel)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // ── Data loading ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel — the backend can handle it
        const [casesRes, outcomesRes, attrRes, auditRes] = await Promise.all([
          api.recoveryCases.list(),
          api.outcomes.list(),
          api.revenueAttribution.list(),
          api.audit.all(),
        ]);

        if (cancelled) return;

        setRecoveryCases(casesRes.data ?? []);
        setOutcomes(outcomesRes.data ?? []);
        setAttributions(attrRes.data ?? []);
        setAuditEvents(auditRes.data ?? []);
      } catch (err) {
        if (cancelled) return;
        console.error("Dashboard load failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Aggregate metrics ──────────────────────────────────
  //
  // These numbers are derived from real API data, not hardcoded.

  const metrics = useMemo(() => {
    let revenueAtRisk = 0;
    let openCases = 0;

    for (const c of recoveryCases) {
      const amount = Number(c.estimatedRecovery ?? 0);
      revenueAtRisk += amount;
      if (c.status === "OPEN" || c.status === "IN_PROGRESS") {
        openCases++;
      }
    }

    let revenueRecovered = 0;
    const successfulOutcomes = outcomes.filter(
      (o) => o.status === "SUCCESS"
    );

    for (const o of successfulOutcomes) {
      revenueRecovered += Number(o.recoveredAmount ?? 0);
    }

    const recoveryRate =
      revenueAtRisk > 0 ? (revenueRecovered / revenueAtRisk) * 100 : 0;

    return {
      revenueAtRisk,
      revenueRecovered,
      recoveryRate,
      activeCases: openCases,
      // Each outcome represents an action execution
      actionsExecuted: outcomes.length,
    };
  }, [recoveryCases, outcomes]);

  // Prefer the currency from the first real data point
  const currency =
    recoveryCases[0]?.currency ??
    outcomes[0]?.currency ??
    DEFAULT_CURRENCY;

  // ── Error state ────────────────────────────────────────

  if (error) {
    return (
      <AppShell pageTitle="Overview" pageSubtitle="Here's what's happening with your revenue recovery today.">
        <div
          className="rounded-xl p-6 max-w-lg"
          style={{
            background: "var(--danger-dim)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <h2 className="text-base font-bold" style={{ color: "#ef4444" }}>
            Failed to connect to backend
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {error}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Make sure the server is running on port 4000.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
            style={{ fontSize: "13px" }}
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Dashboard ──────────────────────────────────────────

  return (
    <AppShell
      pageTitle="Overview"
      pageSubtitle="Here's what's happening with your revenue recovery today."
    >
      {/* The main content scrolls — panel sits on top of it */}
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ── 1. KPI Cards ─────────────────────────────── */}
        <MetricCards
          revenueAtRisk={metrics.revenueAtRisk}
          revenueRecovered={metrics.revenueRecovered}
          recoveryRate={metrics.recoveryRate}
          activeCases={metrics.activeCases}
          actionsExecuted={metrics.actionsExecuted}
          currency={currency}
          loading={loading}
        />

        {/* ── 2. Charts row ─────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Revenue over time chart — takes 3/5 columns */}
          <div className="lg:col-span-3">
            <RevenueRecoveryCard
              recoveryCases={recoveryCases}
              outcomes={outcomes}
              currency={currency}
              loading={loading}
            />
          </div>

          {/* Recovery by workflow donut — takes 2/5 columns */}
          <div className="lg:col-span-2">
            <RecoveryByWorkflow
              recoveryCases={recoveryCases}
              currency={currency}
              loading={loading}
            />
          </div>
        </div>

        {/* ── 3. At-Risk Cases Table ────────────────────── */}
        <RecoveryCasesTable
          recoveryCases={recoveryCases}
          onSelectCase={setSelectedCaseId}
          selectedCaseId={selectedCaseId}
          loading={loading}
        />

        {/* ── 4. AI Insights & Audit Activity ───────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AIInsights
            recoveryCases={recoveryCases}
            auditEvents={auditEvents}
          />
          <RecentAuditEvents
            events={auditEvents}
            limit={6}
          />
        </div>

        {/* ── 5. How It Works ───────────────────────────── */}
        <HowItWorksSection />
      </div>

      {/* ── Case Detail Panel (overlaid, not in flow) ───── */}
      {selectedCaseId && (
        <CaseDetailPanel
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </AppShell>
  );
}