"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import type { Outcome } from "@/lib/types";
import { formatCurrency, timeAgo, outcomeBadge, shortId } from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function OutcomesPage() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOutcomes(await api.outcomes.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load outcomes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = outcomes.filter(
    (o) => statusFilter === "ALL" || o.status === statusFilter
  );

  const totalRecovered = outcomes
    .filter((o) => o.status === "SUCCESS" || o.status === "PARTIAL_SUCCESS")
    .reduce((sum, o) => sum + parseFloat(o.recoveredAmount || "0"), 0);

  const successCount = outcomes.filter((o) => o.status === "SUCCESS").length;
  const failedCount = outcomes.filter((o) => o.status === "FAILED").length;

  const statuses = ["ALL", "SUCCESS", "PARTIAL_SUCCESS", "FAILED", "NO_CHANGE"];
  const colorMap: Record<string, string> = {
    SUCCESS: "var(--green)",
    PARTIAL_SUCCESS: "var(--gold)",
    FAILED: "var(--red)",
    NO_CHANGE: "var(--text-muted)",
  };

  return (
    <>
      <div className="page-header">
        <BarChart3 size={18} color="var(--green)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Outcomes</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {outcomes.length} recorded · {formatCurrency(totalRecovered, "INR")} recovered
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Summary cards */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}
        >
          <div className="metric-card green">
            <div className="metric-value" style={{ color: "var(--green)", fontSize: 24 }}>{successCount}</div>
            <div className="metric-label">Successful</div>
          </div>
          <div className="metric-card red">
            <div className="metric-value" style={{ color: "var(--red)", fontSize: 24 }}>{failedCount}</div>
            <div className="metric-label">Failed</div>
          </div>
          <div className="metric-card gold">
            <div className="metric-value" style={{ color: "var(--gold)", fontSize: 22 }}>
              {outcomes.length > 0 ? Math.round((successCount / outcomes.length) * 100) : 0}%
            </div>
            <div className="metric-label">Success Rate</div>
          </div>
          <div className="metric-card blue">
            <div className="metric-value" style={{ color: "var(--blue)", fontSize: 20 }}>
              {formatCurrency(totalRecovered, "INR")}
            </div>
            <div className="metric-label">Total Recovered</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: statusFilter === s ? "var(--green)" : "var(--border-dim)",
                background: statusFilter === s ? "var(--green-dim)" : "var(--bg-elevated)",
                color: statusFilter === s ? "var(--green)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading || error || filtered.length === 0 ? (
            <LoadingState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyMessage="No outcomes recorded yet." onRetry={load} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Outcome ID</th>
                  <th>Case</th>
                  <th>Status</th>
                  <th>Recovered Amount</th>
                  <th>Failure Reason</th>
                  <th>Occurred</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td><span className="truncate-id">{shortId(o.id)}</span></td>
                    <td>
                      <Link
                        href={`/recovery-cases/${o.recoveryCaseId}`}
                        style={{ color: "var(--blue)", fontSize: 12 }}
                      >
                        {shortId(o.recoveryCaseId)}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${outcomeBadge(o.status)}`} style={{ fontSize: 11 }}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          fontWeight: o.recoveredAmount ? 600 : 400,
                          color: o.recoveredAmount ? "var(--green)" : "var(--text-muted)",
                        }}
                      >
                        {o.recoveredAmount
                          ? formatCurrency(o.recoveredAmount, o.currency)
                          : "—"}
                      </span>
                    </td>
                    <td>
                      {o.failureReason ? (
                        <span style={{ fontSize: 12, color: "var(--red)", fontStyle: "italic" }}>
                          {o.failureReason}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {timeAgo(o.occurredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
