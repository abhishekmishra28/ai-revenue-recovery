"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Play } from "lucide-react";
import { api } from "@/lib/api";
import type { RecoveryAction } from "@/lib/types";
import { timeAgo, formatDateTime, actionStatusBadge, shortId } from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function RecoveryActionsPage() {
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setActions(await api.recoveryActions.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load actions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statuses = ["ALL", "PENDING", "VALIDATED", "EXECUTING", "SUCCEEDED", "FAILED", "SKIPPED"];
  const filtered = actions.filter(
    (a) => statusFilter === "ALL" || a.status === statusFilter
  );

  const statusCounts = statuses.slice(1).map((s) => ({
    status: s,
    count: actions.filter((a) => a.status === s).length,
  }));

  const colorMap: Record<string, string> = {
    SUCCEEDED: "var(--green)",
    FAILED: "var(--red)",
    EXECUTING: "var(--orange)",
    PENDING: "var(--blue)",
    VALIDATED: "var(--gold)",
    REJECTED: "var(--red)",
    SKIPPED: "var(--text-muted)",
  };

  return (
    <>
      <div className="page-header">
        <Play size={18} color="var(--blue)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Recovery Actions</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {actions.length} total actions
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Status summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${statusCounts.length}, 1fr)`,
            gap: 10,
            marginBottom: 20,
          }}
        >
          {statusCounts.map(({ status, count }) => (
            <div
              key={status}
              className="card-sm"
              style={{
                cursor: "pointer",
                textAlign: "center",
                borderColor: statusFilter === status ? colorMap[status] : undefined,
                background:
                  statusFilter === status ? `${colorMap[status]}10` : undefined,
              }}
              onClick={() => setStatusFilter(statusFilter === status ? "ALL" : status)}
            >
              <div
                style={{
                  fontSize: 20,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: colorMap[status],
                  marginBottom: 4,
                }}
              >
                {count}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
                {status}
              </div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: statusFilter === s ? "var(--blue)" : "var(--border-dim)",
                background: statusFilter === s ? "var(--blue-dim)" : "var(--bg-elevated)",
                color: statusFilter === s ? "var(--blue)" : "var(--text-secondary)",
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
            <LoadingState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyMessage="No recovery actions found." onRetry={load} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action ID</th>
                  <th>Case</th>
                  <th>Action Type</th>
                  <th>Status</th>
                  <th>Executed</th>
                  <th>Completed</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td><span className="truncate-id">{shortId(a.id)}</span></td>
                    <td>
                      <Link
                        href={`/recovery-cases/${a.recoveryCaseId}`}
                        style={{ color: "var(--blue)", fontSize: 12 }}
                      >
                        {shortId(a.recoveryCaseId)}
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {a.actionType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${actionStatusBadge(a.status)}`} style={{ fontSize: 11 }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {a.executedAt ? timeAgo(a.executedAt) : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {a.completedAt ? timeAgo(a.completedAt) : "—"}
                    </td>
                    <td>
                      {a.errorCode ? (
                        <span
                          title={a.errorMessage ?? ""}
                          style={{
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            color: "var(--red)",
                            cursor: "help",
                          }}
                        >
                          {a.errorCode}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                      )}
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
