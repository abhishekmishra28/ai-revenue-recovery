"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { RevenueEvent } from "@/lib/types";
import {
  formatDateTime,
  timeAgo,
  eventTypeBadge,
  formatEventType,
  shortId,
} from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

export default function RevenueEventsPage() {
  const [events, setEvents] = useState<RevenueEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await api.revenueEvents.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const types = [
    "ALL",
    "PAYMENT_FAILED",
    "PAYMENT_SUCCEEDED",
    "CHECKOUT_ABANDONED",
    "SUBSCRIPTION_PAYMENT_FAILED",
    "SUBSCRIPTION_RENEWED",
  ];

  const filtered = events.filter((e) => {
    const matchType = typeFilter === "ALL" || e.eventType === typeFilter;
    const matchSearch =
      !search ||
      e.id.includes(search) ||
      e.externalEventId.includes(search) ||
      e.eventType.includes(search.toUpperCase());
    return matchType && matchSearch;
  });

  const processed = events.filter((e) => e.processedAt).length;
  const pending = events.filter((e) => !e.processedAt).length;

  return (
    <>
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Revenue Events</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {events.length} events · {processed} processed · {pending} pending
          </div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Summary row */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}
        >
          {types.slice(1).map((t) => {
            const count = events.filter((e) => e.eventType === t).length;
            return (
              <div
                key={t}
                className="card-sm"
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => setTypeFilter(t === typeFilter ? "ALL" : t)}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    color: typeFilter === t ? "var(--gold)" : "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {count}
                </div>
                <span className={`badge ${eventTypeBadge(t)}`} style={{ fontSize: 10 }}>
                  {t.replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "0 0 260px" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by ID or event type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["ALL", "Processed", "Pending"].map((f) => (
              <button
                key={f}
                onClick={() => {}}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-dim)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading || error || filtered.length === 0 ? (
            <LoadingState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyMessage="No revenue events found." onRetry={load} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>External ID</th>
                  <th>Event Type</th>
                  <th>Status</th>
                  <th>Occurred</th>
                  <th>Processed At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr key={ev.id}>
                    <td><span className="truncate-id">{shortId(ev.id)}</span></td>
                    <td>
                      <span className="mono">{ev.externalEventId.slice(0, 20)}…</span>
                    </td>
                    <td>
                      <span className={`badge ${eventTypeBadge(ev.eventType)}`} style={{ fontSize: 11 }}>
                        {formatEventType(ev.eventType)}
                      </span>
                    </td>
                    <td>
                      {ev.processedAt ? (
                        <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Processed</span>
                      ) : (
                        <span className="badge badge-gold" style={{ fontSize: 11 }}>⏳ Pending</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {timeAgo(ev.occurredAt)}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {ev.processedAt ? formatDateTime(ev.processedAt) : "—"}
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
