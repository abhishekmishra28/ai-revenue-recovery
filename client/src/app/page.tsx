"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { api } from "@/lib/api";
import type {
  RecoveryCase,
  RevenueAttribution,
  AuditEvent,
  RevenueEvent,
} from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  timeAgo,
  caseStatusBadge,
  priorityBadge,
  eventTypeBadge,
  formatEventType,
} from "@/lib/utils";
import PipelineFlow from "@/components/PipelineFlow";
import { LoadingSpinner } from "@/components/LoadingState";

interface DashboardData {
  cases: RecoveryCase[];
  attributions: RevenueAttribution[];
  auditEvents: AuditEvent[];
  revenueEvents: RevenueEvent[];
  health: { status: string } | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [cases, attributions, auditEvents, revenueEvents, health] =
        await Promise.allSettled([
          api.recoveryCases.list(),
          api.revenueAttributions.list(),
          api.auditEvents.list(),
          api.revenueEvents.list(),
          api.health(),
        ]);

      setData({
        cases: cases.status === "fulfilled" ? cases.value : [],
        attributions:
          attributions.status === "fulfilled" ? attributions.value : [],
        auditEvents:
          auditEvents.status === "fulfilled" ? auditEvents.value : [],
        revenueEvents:
          revenueEvents.status === "fulfilled" ? revenueEvents.value : [],
        health: health.status === "fulfilled" ? health.value : null,
      });
    } catch (error) {
      console.error("Dashboard load failed:", error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  // ─── Computed metrics ───────────────────────────────────────
  const totalCases = data?.cases.length ?? 0;
  const activeCases =
    data?.cases.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS")
      .length ?? 0;
  const recoveredCases =
    data?.cases.filter((c) => c.status === "RECOVERED").length ?? 0;
  const successRate =
    totalCases > 0 ? Math.round((recoveredCases / totalCases) * 100) : 0;

  const totalRecovered = data?.attributions.reduce(
    (sum, a) => sum + parseFloat(a.amount || "0"),
    0
  ) ?? 0;

  const recentCases = data?.cases.slice(0, 8) ?? [];
  const recentEvents = data?.auditEvents.slice(0, 6) ?? [];
  const processedEvents =
    data?.revenueEvents.filter((e) => e.processedAt).length ?? 0;
  const pendingEvents =
    data?.revenueEvents.filter((e) => !e.processedAt).length ?? 0;

  const pipelineStages = [
    {
      label: "Revenue\nEvent",
      icon: "⚡",
      count: data?.revenueEvents.length ?? 0,
      href: "/revenue-events",
      color: "var(--gold)",
      bg: "var(--gold-dim)",
    },
    {
      label: "Recovery\nCase",
      icon: "📋",
      count: totalCases,
      href: "/recovery-cases",
      color: "var(--blue)",
      bg: "var(--blue-dim)",
    },
    {
      label: "AI\nStrategy",
      icon: "🧠",
      count: undefined,
      href: "/ai-decisions",
      color: "var(--purple)",
      bg: "var(--purple-dim)",
    },
    {
      label: "Policy\nCheck",
      icon: "🛡️",
      count: undefined,
      href: "/ai-decisions",
      color: "var(--orange)",
      bg: "var(--orange-dim)",
    },
    {
      label: "Recovery\nAction",
      icon: "⚙️",
      count: undefined,
      href: "/recovery-actions",
      color: "var(--blue)",
      bg: "var(--blue-dim)",
    },
    {
      label: "Outcome",
      icon: "📊",
      count: undefined,
      href: "/outcomes",
      color: "var(--green)",
      bg: "var(--green-dim)",
    },
    {
      label: "Attribution",
      icon: "💰",
      count: data?.attributions.length ?? 0,
      href: "/revenue-attribution",
      color: "var(--gold)",
      bg: "var(--gold-dim)",
    },
  ];

  const isHealthy = data?.health?.status === "ok" || data?.health?.status === "healthy";

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            Last updated {timeAgo(lastRefresh.toISOString())}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Health indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: isHealthy ? "var(--green)" : "var(--red)",
              background: isHealthy ? "var(--green-dim)" : "var(--red-dim)",
              padding: "5px 10px",
              borderRadius: 100,
            }}
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : isHealthy ? (
              <Wifi size={12} />
            ) : (
              <WifiOff size={12} />
            )}
            {data === null ? "Connecting…" : isHealthy ? "API Online" : "API Offline"}
          </div>

          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="page-body fade-in">
        {/* ─── Metric Cards ──────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div className="metric-card gold">
            <div
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
            >
              <div>
                <div className="metric-value" style={{ color: "var(--gold)" }}>
                  {loading ? "—" : formatCurrency(totalRecovered, "INR")}
                </div>
                <div className="metric-label">Total Recovered</div>
              </div>
              <TrendingUp size={20} color="var(--gold)" style={{ opacity: 0.6 }} />
            </div>
            <div className="metric-sub">{data?.attributions.length ?? "—"} attributions</div>
          </div>

          <div className="metric-card blue">
            <div
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
            >
              <div>
                <div className="metric-value" style={{ color: "var(--blue)" }}>
                  {loading ? "—" : totalCases}
                </div>
                <div className="metric-label">Total Cases</div>
              </div>
              <AlertCircle size={20} color="var(--blue)" style={{ opacity: 0.6 }} />
            </div>
            <div className="metric-sub">{activeCases} currently active</div>
          </div>

          <div className="metric-card green">
            <div
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
            >
              <div>
                <div className="metric-value" style={{ color: "var(--green)" }}>
                  {loading ? "—" : `${successRate}%`}
                </div>
                <div className="metric-label">Recovery Rate</div>
              </div>
              <CheckCircle2 size={20} color="var(--green)" style={{ opacity: 0.6 }} />
            </div>
            <div className="metric-sub">{recoveredCases} cases recovered</div>
          </div>

          <div className="metric-card purple">
            <div
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
            >
              <div>
                <div className="metric-value" style={{ color: "var(--purple)" }}>
                  {loading ? "—" : pendingEvents}
                </div>
                <div className="metric-label">Pending Events</div>
              </div>
              <Clock size={20} color="var(--purple)" style={{ opacity: 0.6 }} />
            </div>
            <div className="metric-sub">{processedEvents} events processed</div>
          </div>
        </div>

        {/* ─── Recovery Pipeline ─────────────────────────────── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}
              >
                Recovery Pipeline
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                End-to-end AI recovery flow — click any stage to explore
              </div>
            </div>
            <Link href="/orchestrator" className="btn btn-primary">
              <span>Run Pipeline</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <PipelineFlow stages={pipelineStages} animated />
        </div>

        {/* ─── Bottom grid ───────────────────────────────────── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          {/* Recent Cases */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Recent Recovery Cases
              </span>
              <Link
                href="/recovery-cases"
                style={{
                  fontSize: 12,
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
                <LoadingSpinner />
              </div>
            ) : recentCases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-text">No recovery cases yet</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Amount</th>
                    <th>Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link
                          href={`/recovery-cases/${c.id}`}
                          style={{
                            color: "var(--blue)",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {c.caseType.replace(/_/g, " ")}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge ${caseStatusBadge(c.status)}`} style={{ fontSize: 10 }}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${priorityBadge(c.priority)}`} style={{ fontSize: 10 }}>
                          {c.priority}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {c.estimatedRecovery
                          ? formatCurrency(c.estimatedRecovery, c.currency)
                          : "—"}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {timeAgo(c.openedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Audit Log */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Live Audit Events
              </span>
              <Link
                href="/audit"
                style={{
                  fontSize: 12,
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
                <LoadingSpinner />
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-text">No audit events yet</div>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {recentEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: "10px 20px",
                      borderBottom: "1px solid var(--border-dim)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <ActorIcon actor={ev.actorType} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {ev.eventType.replace(/_/g, " ")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {ev.actorType} · {timeAgo(ev.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue Events breakdown */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>Revenue Events</span>
              <Link
                href="/revenue-events"
                style={{
                  fontSize: 12,
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
                <LoadingSpinner />
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Type</th>
                    <th>Status</th>
                    <th>Occurred</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.revenueEvents.slice(0, 6) ?? []).map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <span
                          className={`badge ${eventTypeBadge(ev.eventType)}`}
                          style={{ fontSize: 10 }}
                        >
                          {formatEventType(ev.eventType)}
                        </span>
                      </td>
                      <td>
                        {ev.processedAt ? (
                          <span className="badge badge-green" style={{ fontSize: 10 }}>
                            Processed
                          </span>
                        ) : (
                          <span className="badge badge-muted" style={{ fontSize: 10 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {timeAgo(ev.occurredAt)}
                      </td>
                    </tr>
                  ))}
                  {(data?.revenueEvents.length ?? 0) === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          textAlign: "center",
                          color: "var(--text-muted)",
                          padding: 24,
                        }}
                      >
                        No revenue events yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Case status distribution */}
          <div className="card">
            <div
              style={{ fontWeight: 600, fontSize: 14, marginBottom: 20 }}
            >
              Case Status Distribution
            </div>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <LoadingSpinner />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { status: "OPEN", color: "var(--blue)", label: "Open" },
                  { status: "IN_PROGRESS", color: "var(--orange)", label: "In Progress" },
                  { status: "RECOVERED", color: "var(--green)", label: "Recovered" },
                  { status: "FAILED", color: "var(--red)", label: "Failed" },
                  { status: "CLOSED", color: "var(--text-muted)", label: "Closed" },
                ].map(({ status, color, label }) => {
                  const count =
                    data?.cases.filter((c) => c.status === status).length ?? 0;
                  const pct = totalCases > 0 ? (count / totalCases) * 100 : 0;
                  return (
                    <div key={status}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            color,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          background: "var(--border-dim)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: color,
                            borderRadius: 2,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {totalCases === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 13,
                      padding: "16px 0",
                    }}
                  >
                    No cases to display
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ActorIcon({ actor }: { actor: string }) {
  const map: Record<string, { icon: string; color: string; bg: string }> = {
    AI: { icon: "🧠", color: "var(--purple)", bg: "var(--purple-dim)" },
    SYSTEM: { icon: "⚙️", color: "var(--blue)", bg: "var(--blue-dim)" },
    MERCHANT: { icon: "🏪", color: "var(--gold)", bg: "var(--gold-dim)" },
    ADMIN: { icon: "👤", color: "var(--orange)", bg: "var(--orange-dim)" },
  };
  const style = map[actor] ?? { icon: "❓", color: "var(--text-muted)", bg: "var(--bg-elevated)" };
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: style.bg,
        border: `1px solid ${style.color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {style.icon}
    </div>
  );
}
