"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Store } from "lucide-react";
import { api } from "@/lib/api";
import type { Merchant } from "@/lib/types";
import { formatDateTime, timeAgo, shortId } from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMerchants(await api.merchants.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load merchants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = merchants.filter((m) => m.status === "ACTIVE").length;

  return (
    <>
      <div className="page-header">
        <Store size={18} color="var(--gold)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Merchants</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {merchants.length} registered · {active} active
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {loading || error || merchants.length === 0 ? (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <LoadingState
              loading={loading}
              error={error}
              empty={!loading && !error && merchants.length === 0}
              emptyMessage="No merchants configured."
              onRetry={load}
            />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {merchants.map((m) => (
              <div
                key={m.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  transition: "transform 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-bright)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-dim)";
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "var(--gold-dim)",
                        border: "1px solid var(--gold-glow)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      🏪
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <code
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--text-muted)",
                        }}
                      >
                        {shortId(m.id)}
                      </code>
                    </div>
                  </div>
                  <span
                    className={`badge ${m.status === "ACTIVE" ? "badge-green" : "badge-muted"}`}
                  >
                    {m.status}
                  </span>
                </div>

                {/* Details */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Currency</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--gold)",
                      }}
                    >
                      {m.defaultCurrency}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Created</span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Last Updated</span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {timeAgo(m.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Full ID */}
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Merchant ID
                  </div>
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      background: "var(--bg-elevated)",
                      padding: "4px 8px",
                      borderRadius: 5,
                      display: "block",
                      wordBreak: "break-all",
                    }}
                  >
                    {m.id}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
