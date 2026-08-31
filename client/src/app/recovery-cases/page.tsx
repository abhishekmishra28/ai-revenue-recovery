"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Search, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import type { RecoveryCase } from "@/lib/types";
import {
  formatCurrency,
  timeAgo,
  caseStatusBadge,
  priorityBadge,
  riskBadge,
  shortId,
} from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function RecoveryCasesPage() {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.recoveryCases.list();
      setCases(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = cases.filter((c) => {
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchSearch =
      !search ||
      c.id.includes(search) ||
      c.caseType.includes(search.toUpperCase()) ||
      (c.merchantId && c.merchantId.includes(search));
    return matchStatus && matchSearch;
  });

  const statuses = ["ALL", "OPEN", "IN_PROGRESS", "RECOVERED", "FAILED", "CLOSED"];

  return (
    <>
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Recovery Cases
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {cases.length} total cases
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "0 0 260px" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by ID or type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor:
                    statusFilter === s ? "var(--gold)" : "var(--border-dim)",
                  background:
                    statusFilter === s ? "var(--gold-dim)" : "var(--bg-elevated)",
                  color:
                    statusFilter === s ? "var(--gold)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s === "ALL" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading || error || filtered.length === 0 ? (
            <LoadingState
              loading={loading}
              error={error}
              empty={!loading && !error && filtered.length === 0}
              emptyMessage="No recovery cases match your filters."
              onRetry={load}
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Risk</th>
                  <th>Est. Recovery</th>
                  <th>Opened</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="truncate-id">{shortId(c.id)}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {c.caseType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${caseStatusBadge(c.status)}`} style={{ fontSize: 11 }}>
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "currentColor",
                            display: "inline-block",
                          }}
                        />
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${priorityBadge(c.priority)}`} style={{ fontSize: 11 }}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      {c.riskLevel ? (
                        <span className={`badge ${riskBadge(c.riskLevel)}`} style={{ fontSize: 11 }}>
                          {c.riskLevel}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: c.estimatedRecovery ? "var(--green)" : "var(--text-muted)",
                        }}
                      >
                        {c.estimatedRecovery
                          ? formatCurrency(c.estimatedRecovery, c.currency)
                          : "—"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {timeAgo(c.openedAt)}
                    </td>
                    <td>
                      <Link
                        href={`/recovery-cases/${c.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          color: "var(--blue)",
                        }}
                      >
                        <ExternalLink size={12} />
                        View
                      </Link>
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
