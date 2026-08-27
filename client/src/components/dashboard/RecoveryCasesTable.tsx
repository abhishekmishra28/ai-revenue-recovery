"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import type { RecoveryCase, RiskLevel, Priority } from "@/types/recovery";

type Props = {
  recoveryCases: RecoveryCase[];
  onSelectCase: (caseId: string) => void;
  selectedCaseId: string | null;
  loading?: boolean;
};

// ──────────────────────────────────────────────────────────
// Badge helpers — each returns inline styles for consistent
// colour coding across the whole dashboard
// ──────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  switch (status) {
    case "OPEN":
      return { background: "rgba(245,158,11,0.15)", color: "#f59e0b" };
    case "IN_PROGRESS":
      return { background: "rgba(99,102,241,0.15)", color: "#818cf8" };
    case "RECOVERED":
      return { background: "rgba(16,185,129,0.15)", color: "#10b981" };
    case "FAILED":
      return { background: "rgba(239,68,68,0.15)", color: "#ef4444" };
    case "CLOSED":
      return { background: "rgba(100,116,139,0.15)", color: "#64748b" };
    default:
      return { background: "rgba(100,116,139,0.15)", color: "#64748b" };
  }
}

function getRiskStyle(risk: RiskLevel | string) {
  switch (risk) {
    case "CRITICAL": return { color: "#ef4444" };
    case "HIGH":     return { color: "#f97316" };
    case "MEDIUM":   return { color: "#f59e0b" };
    case "LOW":      return { color: "#10b981" };
    default:         return { color: "#64748b" };
  }
}

function getPriorityStyle(priority: Priority | string) {
  switch (priority) {
    case "CRITICAL": return { background: "rgba(239,68,68,0.15)", color: "#ef4444" };
    case "HIGH":     return { background: "rgba(249,115,22,0.15)", color: "#f97316" };
    case "MEDIUM":   return { background: "rgba(245,158,11,0.15)", color: "#f59e0b" };
    case "LOW":      return { background: "rgba(16,185,129,0.15)", color: "#10b981" };
    default:         return { background: "rgba(100,116,139,0.15)", color: "#64748b" };
  }
}

// Map case type to a friendly workflow label
function getWorkflowLabel(caseType: string): string {
  switch (caseType) {
    case "FAILED_PAYMENT":       return "Failed Payment";
    case "CHECKOUT_ABANDONMENT": return "Checkout Abandonment";
    case "SUBSCRIPTION_FAILURE": return "Failed Subscription";
    default:                     return caseType.replace(/_/g, " ");
  }
}

// Map case type to a label color
function getWorkflowColor(caseType: string): string {
  switch (caseType) {
    case "FAILED_PAYMENT":       return "#ef4444";
    case "CHECKOUT_ABANDONMENT": return "#f59e0b";
    case "SUBSCRIPTION_FAILURE": return "#a855f7";
    default:                     return "#64748b";
  }
}

function formatCurrency(amount: string | number | null, currency: string): string {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Derive a suggested action from strategy decisions or case type
function suggestedAction(c: RecoveryCase): string {
  const strategy = c.strategyDecisions?.[0]?.decision;
  if (strategy) {
    return strategy.replace(/_/g, " ");
  }
  switch (c.caseType) {
    case "FAILED_PAYMENT":       return "Retry Payment";
    case "CHECKOUT_ABANDONMENT": return "Send Reminder";
    case "SUBSCRIPTION_FAILURE": return "Update Payment Method";
    default:                     return "Review";
  }
}

// ──────────────────────────────────────────────────────────

/**
 * RecoveryCasesTable
 *
 * Shows the "Recent At-Risk Cases" table. Clicking a row
 * fires onSelectCase() which opens the CaseDetailPanel.
 */
export default function RecoveryCasesTable({
  recoveryCases,
  onSelectCase,
  selectedCaseId,
  loading = false,
}: Props) {
  // Show only the most recent 8 cases on the main dashboard
  const visible = recoveryCases.slice(0, 8);

  return (
    <div
      className="rounded-xl"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent At-Risk Cases
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {recoveryCases.length} total cases — click a row to view details
          </p>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Column headers */}
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["ID", "Workflow", "Revenue at Risk", "Risk", "Status", "Suggested Action", "Created"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)", fontSize: "10px" }}
                  >
                    {col}
                  </th>
                )
              )}
              {/* Empty header for the chevron column */}
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No recovery cases found.
                </td>
              </tr>
            ) : (
              visible.map((c) => {
                const isSelected = c.id === selectedCaseId;

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isSelected
                        ? "var(--accent-primary-dim)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--bg-elevated)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                      }
                    }}
                  >
                    {/* Case ID — short for readability */}
                    <td className="px-4 py-3 font-mono" style={{ color: "var(--accent-hover)" }}>
                      EVT-{c.id.slice(0, 6).toUpperCase()}
                    </td>

                    {/* Workflow type */}
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: `${getWorkflowColor(c.caseType)}20`,
                          color: getWorkflowColor(c.caseType),
                        }}
                      >
                        {getWorkflowLabel(c.caseType)}
                      </span>
                    </td>

                    {/* Revenue at risk */}
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(c.estimatedRecovery, c.currency || "INR")}
                    </td>

                    {/* Risk level */}
                    <td className="px-4 py-3">
                      <span
                        className="font-semibold uppercase tracking-wide"
                        style={{ fontSize: "10px", ...getRiskStyle(c.riskLevel) }}
                      >
                        {c.riskLevel}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span
                        className="badge"
                        style={getStatusStyle(c.status)}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Suggested action */}
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {suggestedAction(c)}
                    </td>

                    {/* Time ago */}
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(c.createdAt)}
                    </td>

                    {/* Row chevron */}
                    <td className="px-4 py-3">
                      <ChevronRight
                        className="h-4 w-4"
                        style={{
                          color: isSelected
                            ? "var(--accent-primary)"
                            : "var(--text-muted)",
                        }}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer link ───────────────────────────────── */}
      {recoveryCases.length > 8 && (
        <div
          className="flex items-center justify-center gap-1 px-5 py-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "var(--accent-primary)" }}
          >
            View All At-Risk Cases
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}