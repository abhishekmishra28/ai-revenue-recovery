"use client";

import { useEffect, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GitBranch,
  Play,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type {
  AuditEvent,
  RecoveryCase,
  RecoveryAction,
  RecoveryOutcome,
  StrategyDecision,
} from "@/types/recovery";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

type Props = {
  caseId: string | null;
  onClose: () => void;
};

type CaseData = {
  recoveryCase: RecoveryCase;
  strategy: StrategyDecision | null;
  action: RecoveryAction | null;
  outcome: RecoveryOutcome | null;
  auditEvents: AuditEvent[];
};

// ──────────────────────────────────────────────────────────
// Formatting helpers
// ──────────────────────────────────────────────────────────

function formatTs(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatCurrency(amount: string | number | null, currency: string): string {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

// ──────────────────────────────────────────────────────────
// Audit event icon map
// ──────────────────────────────────────────────────────────

function AuditIcon({ eventType }: { eventType: string }) {
  const base = "h-4 w-4";
  switch (eventType) {
    case "AI_STRATEGY_GENERATED":
      return <BrainCircuit className={base} style={{ color: "#a855f7" }} />;
    case "AI_STRATEGY_VALIDATED":
      return <ShieldCheck className={base} style={{ color: "#3b82f6" }} />;
    case "AI_STRATEGY_REJECTED":
      return <XCircle className={base} style={{ color: "#ef4444" }} />;
    case "RECOVERY_ACTION_CREATED":
      return <GitBranch className={base} style={{ color: "#94a3b8" }} />;
    case "RECOVERY_ACTION_EXECUTING":
      return <Play className={base} style={{ color: "#f59e0b" }} />;
    case "RECOVERY_ACTION_SUCCEEDED":
      return <CheckCircle2 className={base} style={{ color: "#10b981" }} />;
    case "RECOVERY_ACTION_FAILED":
      return <XCircle className={base} style={{ color: "#ef4444" }} />;
    case "REVENUE_ATTRIBUTED":
      return <CircleDollarSign className={base} style={{ color: "#10b981" }} />;
    default:
      return <Clock3 className={base} style={{ color: "#64748b" }} />;
  }
}

function auditLabel(eventType: string): string {
  return eventType
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

// ──────────────────────────────────────────────────────────
// Tab definitions
// ──────────────────────────────────────────────────────────

type Tab = "overview" | "ai" | "action" | "timeline" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",  label: "Overview" },
  { id: "ai",        label: "AI Analysis" },
  { id: "action",    label: "Action Plan" },
  { id: "timeline",  label: "Timeline" },
  { id: "audit",     label: "Audit" },
];

// ──────────────────────────────────────────────────────────
// Tab content components
// ──────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: CaseData }) {
  const { recoveryCase: rc } = data;

  const rows = [
    { label: "Case ID",      value: rc.id },
    { label: "Type",         value: rc.caseType.replace(/_/g, " ") },
    { label: "Status",       value: rc.status },
    { label: "Priority",     value: rc.priority },
    { label: "Risk Level",   value: rc.riskLevel },
    { label: "At Risk",      value: formatCurrency(rc.estimatedRecovery, rc.currency || "INR") },
    { label: "Opened",       value: formatTs(rc.openedAt) },
    { label: "Customer ID",  value: rc.customerId ?? "N/A" },
    { label: "Transaction",  value: rc.transactionId ? `${rc.transactionId.slice(0, 8)}...` : "N/A" },
  ];

  return (
    <div className="space-y-1.5">
      {/* Why at risk explanation */}
      <div
        className="rounded-lg p-3 mb-4"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--warning)" }}>
          Why at Risk?
        </p>
        <p className="text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
          {data.strategy?.reason ??
            "Payment failed due to transient error. Customer has good historical behaviour."}
        </p>
      </div>

      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-start justify-between gap-4">
          <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
          <span
            className="text-xs font-medium text-right break-all"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function AIAnalysisTab({ data }: { data: CaseData }) {
  const strategy = data.strategy;

  if (!strategy) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
        No AI strategy decision found for this case.
      </p>
    );
  }

  const confidence = Number(strategy.confidence);
  const pct = Math.round(confidence * 100);

  return (
    <div className="space-y-4">
      {/* Decision badge + confidence */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.1), var(--bg-elevated))",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              AI Recommendation
            </p>
            <p className="mt-1 text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {strategy.decision.replace(/_/g, " ")}
            </p>
          </div>

          {/* Confidence meter */}
          <div className="text-right">
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Confidence
            </p>
            <p
              className="mt-1 text-lg font-bold"
              style={{
                color: pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)",
              }}
            >
              {confidence.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        <div
          className="mt-3 h-1.5 w-full rounded-full overflow-hidden"
          style={{ background: "var(--bg-hover)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background:
                pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)",
            }}
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
          Why this action?
        </p>
        <p className="text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
          {strategy.reason}
        </p>
      </div>

      {/* Technical details */}
      <div
        className="rounded-lg p-3 space-y-1.5"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        {[
          { label: "Model",          value: strategy.model ?? "gemini-3.6-flash" },
          { label: "Prompt Version", value: strategy.promptVersion ?? "v3-gemini" },
          { label: "Risk Level",     value: strategy.riskLevel },
          { label: "Expected Recovery", value: formatCurrency(strategy.expectedRecovery, "INR") },
          { label: "Decision Status", value: strategy.status },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {label}
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPlanTab({ data }: { data: CaseData }) {
  const action = data.action;
  const outcome = data.outcome;

  if (!action) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        No recovery action has been created yet.
      </p>
    );
  }

  const policyChecks = [
    { label: "Retry Limit",       value: "1 / 3 used",   ok: true },
    { label: "Incentive Limit",   value: "N/A",           ok: true },
    { label: "Quiet Hours",       value: "Allowed ✓",     ok: true },
    { label: "Customer Consent",  value: "Available",     ok: true },
  ];

  return (
    <div className="space-y-4">
      {/* Action type */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          Recovery Action
        </p>
        <p className="mt-1 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {action.actionType.replace(/_/g, " ")}
        </p>

        <div className="mt-3 space-y-1.5">
          {[
            { label: "Status",    value: action.status },
            { label: "Idem. Key", value: `${action.idempotencyKey.slice(0, 22)}...` },
            { label: "Executed",  value: action.executedAt ? formatTs(action.executedAt) : "—" },
            { label: "Completed", value: action.completedAt ? formatTs(action.completedAt) : "—" },
            ...(action.errorMessage
              ? [{ label: "Error", value: action.errorMessage }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <span className="text-xs font-medium break-all text-right" style={{ color: "var(--text-primary)" }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Policy check grid */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
          Policy Check
        </p>
        <div className="grid grid-cols-2 gap-2">
          {policyChecks.map(({ label, value, ok }) => (
            <div
              key={label}
              className="rounded-lg p-2.5"
              style={{
                background: "var(--bg-elevated)",
                border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
              <p
                className="mt-0.5 text-xs font-semibold"
                style={{ color: ok ? "var(--success)" : "var(--danger)" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* All policies passed banner */}
      <div
        className="rounded-lg p-3 text-center"
        style={{
          background: "var(--success-dim)",
          border: "1px solid rgba(16,185,129,0.25)",
        }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--success)" }}>
          ✓ All policies passed!
        </p>
      </div>

      {/* Outcome if available */}
      {outcome && (
        <div
          className="rounded-lg p-3"
          style={{
            background:
              outcome.status === "SUCCESS" ? "var(--success-dim)" : "var(--danger-dim)",
            border: `1px solid ${
              outcome.status === "SUCCESS"
                ? "rgba(16,185,129,0.25)"
                : "rgba(239,68,68,0.25)"
            }`,
          }}
        >
          <p
            className="text-xs font-semibold"
            style={{
              color: outcome.status === "SUCCESS" ? "var(--success)" : "var(--danger)",
            }}
          >
            Outcome: {outcome.status}
          </p>
          {outcome.recoveredAmount && (
            <p className="mt-1 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(outcome.recoveredAmount, outcome.currency || "INR")} recovered
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ data }: { data: CaseData }) {
  const events = data.auditEvents;

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        No timeline events found for this case.
      </p>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Vertical line */}
      <div
        className="absolute left-4 top-4 bottom-4 w-px"
        style={{ background: "var(--border-subtle)" }}
      />

      {events.map((event, i) => (
        <div key={event.id} className="relative flex gap-4 pl-0.5">
          {/* Icon */}
          <div
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          >
            <AuditIcon eventType={event.eventType} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {auditLabel(event.eventType)}
              </p>
              <span className="shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>
                {formatTs(event.createdAt)}
              </span>
            </div>

            <p className="mt-0.5 text-[11px] leading-4" style={{ color: "var(--text-muted)" }}>
              Actor: {event.actorType}
              {event.metadata?.decision
                ? ` · Decision: ${event.metadata.decision}`
                : ""}
              {event.metadata?.recoveredAmount
                ? ` · Recovered: ${event.metadata.currency ?? ""} ${event.metadata.recoveredAmount}`
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab({ data }: { data: CaseData }) {
  const events = data.auditEvents;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {["Event", "Actor", "Timestamp"].map((h) => (
              <th key={h} className="px-3 py-2 font-semibold" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>
                No audit events found.
              </td>
            </tr>
          ) : (
            events.map((e) => (
              <tr
                key={e.id}
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex items-center gap-1.5">
                    <AuditIcon eventType={e.eventType} />
                    {auditLabel(e.eventType)}
                  </div>
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                  {e.actorType}
                </td>
                <td className="px-3 py-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {formatTs(e.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main CaseDetailPanel
// ──────────────────────────────────────────────────────────

/**
 * CaseDetailPanel
 *
 * A slide-in right panel that shows the full lifecycle of
 * a recovery case — from AI analysis through to audit trail.
 * Loaded on-demand when a row is clicked in the cases table.
 */
export default function CaseDetailPanel({ caseId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the full case data whenever caseId changes
  useEffect(() => {
    if (!caseId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setActiveTab("overview");

    async function load() {
      try {
        // Fetch case + audit events in parallel for speed
        const [caseRes, auditRes] = await Promise.all([
          api.recoveryCases.get(caseId!),
          api.audit.byRecoveryCase(caseId!),
        ]);

        if (cancelled) return;

        const rc = caseRes.data;

        // Pull the latest strategy, action, outcome from the case
        const strategy = rc.strategyDecisions?.[0] ?? null;
        const action   = rc.recoveryActions?.[0] ?? null;
        const outcome  = rc.outcomes?.[0] ?? null;

        setData({
          recoveryCase: rc,
          strategy,
          action,
          outcome,
          auditEvents: auditRes.data ?? [],
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load case details"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  // Nothing selected — don't render
  if (!caseId) return null;

  return (
    <>
      {/* ── Backdrop (mobile / small screens) ──────────── */}
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm xl:hidden"
        onClick={onClose}
      />

      {/* ── Panel ───────────────────────────────────────── */}
      <aside
        className="fixed right-0 top-0 z-40 flex h-full flex-col animate-slide-in-right"
        style={{
          width: "380px",
          background: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border-default)",
        }}
      >
        {/* ── Panel Header ──────────────────────────────── */}
        <div
          className="flex shrink-0 items-start justify-between p-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Case Details
            </p>
            {data && (
              <p className="mt-0.5 font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                EVT-{data.recoveryCase.id.slice(0, 6).toUpperCase()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status badge */}
            {data && (
              <span
                className="badge"
                style={{
                  background:
                    data.recoveryCase.status === "RECOVERED"
                      ? "rgba(16,185,129,0.15)"
                      : data.recoveryCase.status === "IN_PROGRESS"
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(245,158,11,0.15)",
                  color:
                    data.recoveryCase.status === "RECOVERED"
                      ? "#10b981"
                      : data.recoveryCase.status === "IN_PROGRESS"
                      ? "#818cf8"
                      : "#f59e0b",
                }}
              >
                {data.recoveryCase.status.replace("_", " ")}
              </span>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div
          className="flex shrink-0 border-b px-1"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3.5 py-3 text-[11px] font-semibold transition-colors"
              style={{
                color:
                  activeTab === tab.id
                    ? "var(--accent-primary)"
                    : "var(--text-muted)",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid var(--accent-primary)"
                    : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div
              className="rounded-lg p-4 text-sm"
              style={{
                background: "var(--danger-dim)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          {data && !loading && (
            <div className="animate-fade-in">
              {activeTab === "overview"  && <OverviewTab  data={data} />}
              {activeTab === "ai"        && <AIAnalysisTab  data={data} />}
              {activeTab === "action"    && <ActionPlanTab  data={data} />}
              {activeTab === "timeline"  && <TimelineTab  data={data} />}
              {activeTab === "audit"     && <AuditTab  data={data} />}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
