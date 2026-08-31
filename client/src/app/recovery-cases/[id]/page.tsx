"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Brain, Shield, Play, BarChart3, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import type {
  RecoveryCase,
  AIStrategyDecision,
  RecoveryAction,
  Outcome,
  RevenueAttribution,
  AuditEvent,
} from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  timeAgo,
  caseStatusBadge,
  priorityBadge,
  riskBadge,
  decisionBadge,
  actionStatusBadge,
  outcomeBadge,
  confidencePct,
  shortId,
  formatDecision,
} from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function RecoveryCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [kase, setKase] = useState<RecoveryCase | null>(null);
  const [decisions, setDecisions] = useState<AIStrategyDecision[]>([]);
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [attributions, setAttributions] = useState<RevenueAttribution[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [c, d, a, o, att, audit] = await Promise.allSettled([
        api.recoveryCases.get(id),
        api.aiDecisions.byCase(id),
        api.recoveryActions.byCase(id),
        api.outcomes.byCase(id),
        api.revenueAttributions.byCase(id),
        api.auditEvents.byCase(id),
      ]);

      if (c.status === "rejected") throw new Error("Case not found");

      setKase(c.status === "fulfilled" ? c.value : null);
      setDecisions(d.status === "fulfilled" ? d.value : []);
      setActions(a.status === "fulfilled" ? a.value : []);
      setOutcomes(o.status === "fulfilled" ? o.value : []);
      setAttributions(att.status === "fulfilled" ? att.value : []);
      setAuditEvents(audit.status === "fulfilled" ? audit.value : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const totalRecovered = attributions.reduce(
    (sum, a) => sum + parseFloat(a.amount || "0"),
    0
  );

  if (loading) {
    return (
      <>
        <div className="page-header">
          <button className="btn btn-ghost" onClick={() => router.back()}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>
        <div className="page-body">
          <LoadingState loading />
        </div>
      </>
    );
  }

  if (error || !kase) {
    return (
      <>
        <div className="page-header">
          <button className="btn btn-ghost" onClick={() => router.back()}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>
        <div className="page-body">
          <LoadingState error={error || "Case not found"} onRetry={load} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Recovery Case</span>
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                padding: "2px 8px",
                borderRadius: 5,
              }}
            >
              {shortId(kase.id)}
            </code>
            <span className={`badge ${caseStatusBadge(kase.status)}`}>
              {kase.status.replace("_", " ")}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {kase.caseType.replace(/_/g, " ")} · Opened {timeAgo(kase.openedAt)}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="page-body fade-in">
        {/* Top metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <MetricMini
            label="Priority"
            value={kase.priority}
            color="var(--orange)"
            badge={`badge ${priorityBadge(kase.priority)}`}
          />
          <MetricMini
            label="Risk Level"
            value={kase.riskLevel ?? "Unknown"}
            color="var(--red)"
            badge={kase.riskLevel ? `badge ${riskBadge(kase.riskLevel)}` : undefined}
          />
          <MetricMini
            label="Est. Recovery"
            value={kase.estimatedRecovery
              ? formatCurrency(kase.estimatedRecovery, kase.currency)
              : "—"}
            color="var(--gold)"
          />
          <MetricMini
            label="Recovered"
            value={formatCurrency(totalRecovered, kase.currency)}
            color="var(--green)"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Main: Pipeline stages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* 1. AI Strategy Decisions */}
            <Section icon={<Brain size={16} />} title="AI Strategy Decisions" color="var(--purple)">
              {decisions.length === 0 ? (
                <Empty text="No AI decisions generated yet." />
              ) : (
                decisions.map((d) => (
                  <div key={d.id} className="card-sm" style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}
                        >
                          {formatDecision(d.decision)}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span className={`badge ${decisionBadge(d.status)}`} style={{ fontSize: 11 }}>
                            {d.status}
                          </span>
                          <span className={`badge ${riskBadge(d.riskLevel)}`} style={{ fontSize: 11 }}>
                            Risk: {d.riskLevel}
                          </span>
                          <span className="badge badge-purple" style={{ fontSize: 11 }}>
                            Confidence: {confidencePct(d.confidence)}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {d.expectedRecovery && (
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 13,
                              color: "var(--green)",
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(d.expectedRecovery, kase.currency)}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {timeAgo(d.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div
                      style={{
                        height: 3,
                        background: "var(--border-dim)",
                        borderRadius: 2,
                        overflow: "hidden",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${parseFloat(d.confidence) * 100}%`,
                          background: "linear-gradient(90deg, var(--purple), var(--blue))",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                        marginBottom: 8,
                      }}
                    >
                      {d.reason}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Detail label="Model" value={d.model} mono />
                      <Detail label="Prompt" value={d.promptVersion} mono />
                      {d.tool && <Detail label="Tool" value={d.tool} mono />}
                    </div>
                  </div>
                ))
              )}
            </Section>

            {/* 2. Recovery Actions */}
            <Section icon={<Play size={16} />} title="Recovery Actions" color="var(--blue)">
              {actions.length === 0 ? (
                <Empty text="No recovery actions created yet." />
              ) : (
                <table className="data-table" style={{ background: "transparent" }}>
                  <thead>
                    <tr>
                      <th>Action Type</th>
                      <th>Status</th>
                      <th>Executed</th>
                      <th>Completed</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500, fontSize: 12 }}>
                          {a.actionType.replace(/_/g, " ")}
                        </td>
                        <td>
                          <span className={`badge ${actionStatusBadge(a.status)}`} style={{ fontSize: 11 }}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {a.executedAt ? timeAgo(a.executedAt) : "—"}
                        </td>
                        <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {a.completedAt ? timeAgo(a.completedAt) : "—"}
                        </td>
                        <td>
                          {a.errorMessage ? (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--red)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {a.errorCode}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* 3. Outcomes */}
            <Section icon={<BarChart3 size={16} />} title="Outcomes" color="var(--green)">
              {outcomes.length === 0 ? (
                <Empty text="No outcomes recorded yet." />
              ) : (
                outcomes.map((o) => (
                  <div key={o.id} className="card-sm" style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className={`badge ${outcomeBadge(o.status)}`}>
                          {o.status.replace("_", " ")}
                        </span>
                        {o.failureReason && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--red)",
                              fontStyle: "italic",
                            }}
                          >
                            {o.failureReason}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {o.recoveredAmount && (
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--green)",
                            }}
                          >
                            {formatCurrency(o.recoveredAmount, o.currency)}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {timeAgo(o.occurredAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Section>

            {/* 4. Revenue Attribution */}
            <Section icon={<TrendingUp size={16} />} title="Revenue Attribution" color="var(--gold)">
              {attributions.length === 0 ? (
                <Empty text="No revenue attributed yet." />
              ) : (
                attributions.map((a) => (
                  <div key={a.id} className="card-sm" style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span className="badge badge-gold">{a.attributionType}</span>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          Attributed {timeAgo(a.attributedAt)}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "var(--gold)",
                        }}
                      >
                        {formatCurrency(a.amount, a.currency)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Section>
          </div>

          {/* Right: Info + Audit */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Case Info */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
                Case Details
              </div>
              <InfoRow label="Case ID" value={shortId(kase.id)} mono />
              <InfoRow label="Case Type" value={kase.caseType.replace(/_/g, " ")} />
              <InfoRow label="Currency" value={kase.currency} mono />
              {kase.closedAt && (
                <InfoRow
                  label="Closed"
                  value={formatDateTime(kase.closedAt)}
                />
              )}
              <InfoRow label="Opened" value={formatDateTime(kase.openedAt)} />
              <InfoRow label="Created" value={formatDateTime(kase.createdAt)} />
              {kase.transactionId && (
                <InfoRow label="Transaction" value={shortId(kase.transactionId)} mono />
              )}
              {kase.customerId && (
                <InfoRow label="Customer" value={shortId(kase.customerId)} mono />
              )}
            </div>

            {/* Audit Timeline */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
                Audit Timeline
              </div>
              {auditEvents.length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No audit events
                </div>
              ) : (
                <div className="timeline">
                  {auditEvents.map((ev, i) => (
                    <div key={ev.id} className="timeline-item">
                      <div className={`timeline-dot ${timelineDotColor(ev.actorType)}`} />
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `2px solid ${color}30`,
        }}
      >
        <div style={{ color }}>{icon}</div>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      className="card-sm"
      style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}
    >
      {text}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid var(--border-dim)",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: "var(--text-secondary)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 6,
        padding: "4px 8px",
      }}
    >
      <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 11,
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: "var(--text-secondary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricMini({
  label,
  value,
  color,
  badge,
}: {
  label: string;
  value: string;
  color: string;
  badge?: string;
}) {
  return (
    <div
      className="card-sm"
      style={{ textAlign: "center" }}
    >
      <div className="metric-label" style={{ marginBottom: 8 }}>
        {label}
      </div>
      {badge ? (
        <span className={badge} style={{ fontSize: 13 }}>
          {value}
        </span>
      ) : (
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color,
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}

function timelineDotColor(actor: string): string {
  switch (actor) {
    case "AI":       return "purple";
    case "SYSTEM":   return "blue";
    case "MERCHANT": return "gold";
    case "ADMIN":    return "muted";
    default:         return "muted";
  }
}
