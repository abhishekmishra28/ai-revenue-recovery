"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import type { RevenueAttribution } from "@/lib/types";
import { formatCurrency, formatDateTime, timeAgo, shortId } from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function RevenueAttributionPage() {
  const [attributions, setAttributions] = useState<RevenueAttribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAttributions(await api.revenueAttributions.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load attributions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = attributions.filter(
    (a) => typeFilter === "ALL" || a.attributionType === typeFilter
  );

  const totalDirect = attributions
    .filter((a) => a.attributionType === "DIRECT")
    .reduce((sum, a) => sum + parseFloat(a.amount), 0);

  const totalAssisted = attributions
    .filter((a) => a.attributionType === "ASSISTED")
    .reduce((sum, a) => sum + parseFloat(a.amount), 0);

  const grandTotal = totalDirect + totalAssisted;

  return (
    <>
      <div className="page-header">
        <TrendingUp size={18} color="var(--gold)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Revenue Attribution</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {attributions.length} attributions · {formatCurrency(grandTotal, "INR")} total
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Grand total banner */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, var(--gold-dim), var(--bg-surface))",
            borderColor: "var(--gold-glow)",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Total AI-Recovered Revenue
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 36,
                fontWeight: 700,
                color: "var(--gold)",
                lineHeight: 1,
              }}
            >
              {formatCurrency(grandTotal, "INR")}
            </div>
          </div>
          <div className="divider" style={{ height: 60, width: 1, margin: "0", background: "var(--border-dim)" }} />
          <div style={{ display: "flex", gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>DIRECT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, color: "var(--green)" }}>
                {formatCurrency(totalDirect, "INR")}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {attributions.filter((a) => a.attributionType === "DIRECT").length} attributions
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>ASSISTED</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, color: "var(--blue)" }}>
                {formatCurrency(totalAssisted, "INR")}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {attributions.filter((a) => a.attributionType === "ASSISTED").length} attributions
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["ALL", "DIRECT", "ASSISTED"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: typeFilter === t ? "var(--gold)" : "var(--border-dim)",
                background: typeFilter === t ? "var(--gold-dim)" : "var(--bg-elevated)",
                color: typeFilter === t ? "var(--gold)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t === "ALL" ? "All Types" : t}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading || error || filtered.length === 0 ? (
            <LoadingState
              loading={loading}
              error={error}
              empty={!loading && !error && filtered.length === 0}
              emptyMessage="No revenue attributions yet. Run the orchestrator to generate some!"
              onRetry={load}
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attribution ID</th>
                  <th>Case</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Type</th>
                  <th>Attributed At</th>
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
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--gold)",
                        }}
                      >
                        {formatCurrency(a.amount, a.currency)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {a.currency}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${a.attributionType === "DIRECT" ? "badge-green" : "badge-blue"}`}
                        style={{ fontSize: 11 }}
                      >
                        {a.attributionType}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {timeAgo(a.attributedAt)}
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
