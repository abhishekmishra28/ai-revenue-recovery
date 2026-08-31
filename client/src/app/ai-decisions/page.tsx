"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Brain } from "lucide-react";
import { api } from "@/lib/api";
import type { AIStrategyDecision } from "@/lib/types";
import {
  formatCurrency,
  timeAgo,
  decisionBadge,
  riskBadge,
  confidencePct,
  shortId,
  formatDecision,
} from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function AIDecisionsPage() {
  const [decisions, setDecisions] = useState<AIStrategyDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDecisions(await api.aiDecisions.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load AI decisions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = decisions.filter(
    (d) => statusFilter === "ALL" || d.status === statusFilter
  );

  const avgConfidence =
    decisions.length > 0
      ? decisions.reduce((sum, d) => sum + parseFloat(d.confidence), 0) / decisions.length
      : 0;

  return (
    <>
      <div className="page-header">
        <Brain size={18} color="var(--purple)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AI Decisions</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {decisions.length} total · Avg confidence{" "}
            {decisions.length > 0 ? confidencePct(avgConfidence) : "—"}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {["GENERATED", "VALIDATED", "REJECTED"].map((s) => {
            const count = decisions.filter((d) => d.status === s).length;
            const colorMap: Record<string, string> = {
              GENERATED: "var(--gold)",
              VALIDATED: "var(--green)",
              REJECTED: "var(--red)",
            };
            return (
              <div
                key={s}
                className="metric-card"
                style={{ cursor: "pointer" }}
                onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
              >
                <div
                  className="metric-value"
                  style={{ color: colorMap[s], fontSize: 24 }}
                >
                  {count}
                </div>
                <div className="metric-label">{s}</div>
              </div>
            );
          })}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["ALL", "GENERATED", "VALIDATED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: statusFilter === s ? "var(--purple)" : "var(--border-dim)",
                background: statusFilter === s ? "var(--purple-dim)" : "var(--bg-elevated)",
                color: statusFilter === s ? "var(--purple)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading || error || filtered.length === 0 ? (
            <LoadingState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyMessage="No AI decisions found." onRetry={load} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Decision</th>
                  <th>Confidence</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Exp. Recovery</th>
                  <th>Model</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link
                        href={`/recovery-cases/${d.recoveryCaseId}`}
                        style={{ color: "var(--blue)", fontSize: 12 }}
                      >
                        {shortId(d.recoveryCaseId)}
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {formatDecision(d.decision)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 48,
                            height: 4,
                            background: "var(--border-dim)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${parseFloat(d.confidence) * 100}%`,
                              background: "var(--purple)",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: "var(--purple)",
                          }}
                        >
                          {confidencePct(d.confidence)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${riskBadge(d.riskLevel)}`} style={{ fontSize: 11 }}>
                        {d.riskLevel}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${decisionBadge(d.status)}`} style={{ fontSize: 11 }}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--green)" }}>
                        {d.expectedRecovery ? formatCurrency(d.expectedRecovery, "INR") : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="mono">{d.model}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {timeAgo(d.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Reasoning panel for selected */}
        {filtered.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: "var(--purple)" }}>
              🧠 Latest AI Reasoning
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                fontStyle: "italic",
                borderLeft: "3px solid var(--purple)",
                paddingLeft: 14,
              }}
            >
              {filtered[0].reason}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {filtered[0].model}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {filtered[0].promptVersion}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
