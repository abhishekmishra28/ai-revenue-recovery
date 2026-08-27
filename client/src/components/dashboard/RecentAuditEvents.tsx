"use client";

import {
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GitBranch,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import type { AuditEvent } from "@/types/recovery";

type RecentAuditEventsProps = {
  events: AuditEvent[];
  limit?: number;
};

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function shortId(value: string | null | undefined) {
  if (!value) return "—";
  return `${value.slice(0, 8)}...`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ──────────────────────────────────────────────────────────
// Event configuration
// ──────────────────────────────────────────────────────────

function getEventConfig(eventType: string) {
  const baseIconClass = "h-4 w-4";

  switch (eventType) {
    case "AI_STRATEGY_GENERATED":
      return {
        label: "AI Strategy Generated",
        icon: <BrainCircuit className={baseIconClass} style={{ color: "#a855f7" }} />,
        bgStyle: { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" },
      };

    case "AI_STRATEGY_VALIDATED":
      return {
        label: "AI Strategy Validated",
        icon: <ShieldCheck className={baseIconClass} style={{ color: "#3b82f6" }} />,
        bgStyle: { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" },
      };

    case "AI_STRATEGY_REJECTED":
      return {
        label: "AI Strategy Rejected",
        icon: <XCircle className={baseIconClass} style={{ color: "#ef4444" }} />,
        bgStyle: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" },
      };

    case "RECOVERY_ACTION_CREATED":
      return {
        label: "Recovery Action Created",
        icon: <GitBranch className={baseIconClass} style={{ color: "#94a3b8" }} />,
        bgStyle: { background: "rgba(148,163,184,0.15)", border: "1px solid rgba(148,163,184,0.3)" },
      };

    case "RECOVERY_ACTION_EXECUTING":
      return {
        label: "Recovery Action Executing",
        icon: <Play className={baseIconClass} style={{ color: "#f59e0b" }} />,
        bgStyle: { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" },
      };

    case "RECOVERY_ACTION_SUCCEEDED":
      return {
        label: "Recovery Action Succeeded",
        icon: <CheckCircle2 className={baseIconClass} style={{ color: "#10b981" }} />,
        bgStyle: { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" },
      };

    case "RECOVERY_ACTION_FAILED":
      return {
        label: "Recovery Action Failed",
        icon: <XCircle className={baseIconClass} style={{ color: "#ef4444" }} />,
        bgStyle: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" },
      };

    case "REVENUE_ATTRIBUTED":
      return {
        label: "Revenue Attributed",
        icon: <CircleDollarSign className={baseIconClass} style={{ color: "#10b981" }} />,
        bgStyle: { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" },
      };

    default:
      return {
        label: eventType
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        icon: <Clock3 className={baseIconClass} style={{ color: "#64748b" }} />,
        bgStyle: { background: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)" },
      };
  }
}

function getEventDescription(event: AuditEvent) {
  const metadata = event.metadata || {};

  switch (event.eventType) {
    case "AI_STRATEGY_GENERATED":
      return typeof metadata.reason === "string"
        ? metadata.reason
        : `AI selected ${metadata.decision || "a recovery strategy"}.`;

    case "AI_STRATEGY_VALIDATED":
      return typeof metadata.policyName === "string"
        ? `Approved by policy: ${metadata.policyName}`
        : "AI strategy passed merchant policy validation.";

    case "AI_STRATEGY_REJECTED":
      return typeof metadata.reason === "string"
        ? metadata.reason
        : "AI strategy was rejected by the policy engine.";

    case "RECOVERY_ACTION_CREATED":
      return typeof metadata.actionType === "string"
        ? `${metadata.actionType} action was created.`
        : "A recovery action was created.";

    case "RECOVERY_ACTION_EXECUTING":
      return typeof metadata.actionType === "string"
        ? `${metadata.actionType} action is being executed.`
        : "Recovery action execution started.";

    case "RECOVERY_ACTION_SUCCEEDED":
      return typeof metadata.recoveredAmount !== "undefined"
        ? `Recovered ${metadata.recoveredAmount} ${metadata.currency || ""} successfully.`
        : "Recovery action completed successfully.";

    case "RECOVERY_ACTION_FAILED":
      return typeof metadata.errorMessage === "string"
        ? metadata.errorMessage
        : "Recovery action failed.";

    case "REVENUE_ATTRIBUTED":
      return typeof metadata.amount !== "undefined"
        ? `${metadata.amount} ${metadata.currency || ""} attributed as recovered revenue.`
        : "Recovered revenue was attributed.";

    default:
      return "System audit event recorded.";
  }
}

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────

export default function RecentAuditEvents({
  events,
  limit = 8,
}: RecentAuditEventsProps) {
  const visibleEvents = events.slice(0, limit);

  return (
    <section
      className="rounded-xl"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <div
        className="flex items-center justify-between p-5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Live Audit Trail
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Real-time feed of AI decisions and system executions
          </p>
        </div>

        <div
          className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 sm:flex"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        >
          <span className="status-dot" />
          <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "var(--success)" }}>
            Recording
          </span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      {visibleEvents.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center px-6 text-center">
          <Clock3 className="h-5 w-5 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            No audit events yet
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            System activity will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="p-5">
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute bottom-4 left-5 top-4 w-px"
              style={{ background: "var(--border-subtle)" }}
            />

            <div className="space-y-6">
              {visibleEvents.map((event) => {
                const config = getEventConfig(event.eventType);

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={config.bgStyle}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {config.label}
                          </p>
                          <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
                            {getEventDescription(event)}
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {formatDate(event.createdAt)}
                        </span>
                      </div>

                      {/* Metadata badges */}
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {/* Actor badge */}
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }}
                        >
                          Actor: {event.actorType}
                        </span>

                        {/* Case ID badge */}
                        {event.recoveryCaseId && (
                          <span
                            className="rounded-md px-2 py-0.5 font-mono text-[10px]"
                            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                          >
                            Case: {shortId(event.recoveryCaseId)}
                          </span>
                        )}

                        {/* Decision badge */}
                        {typeof event.metadata?.decision === "string" && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-medium uppercase"
                            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}
                          >
                            {event.metadata.decision}
                          </span>
                        )}

                        {/* Action type badge */}
                        {typeof event.metadata?.actionType === "string" && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-medium uppercase"
                            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
                          >
                            {event.metadata.actionType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}