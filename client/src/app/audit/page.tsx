"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, ScrollText, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { AuditEvent } from "@/lib/types";
import { timeAgo, formatDateTime, actorBadge, shortId } from "@/lib/utils";
import LoadingState from "@/components/LoadingState";

const actorIcon: Record<string, string> = {
  AI: "🧠",
  SYSTEM: "⚙️",
  MERCHANT: "🏪",
  ADMIN: "👤",
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("timeline");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await api.auditEvents.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  const actors = ["ALL", "AI", "SYSTEM", "MERCHANT", "ADMIN"];
  const filtered = events.filter((ev) => {
    const matchActor = actorFilter === "ALL" || ev.actorType === actorFilter;
    const matchSearch =
      !search ||
      ev.eventType.toLowerCase().includes(search.toLowerCase()) ||
      ev.id.includes(search);
    return matchActor && matchSearch;
  });

  return (
    <>
      <div className="page-header">
        <ScrollText size={18} color="var(--blue)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Audit Trail</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {events.length} events · auto-refreshes every 15s
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setViewMode(v => v === "table" ? "timeline" : "table")}
            style={{ fontSize: 12 }}
          >
            {viewMode === "table" ? "Timeline View" : "Table View"}
          </button>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Actor stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {actors.slice(1).map((actor) => {
            const count = events.filter((e) => e.actorType === actor).length;
            return (
              <div
                key={actor}
                className="card-sm"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderColor: actorFilter === actor ? "var(--border-bright)" : undefined,
                }}
                onClick={() => setActorFilter(actorFilter === actor ? "ALL" : actor)}
              >
                <span style={{ fontSize: 22 }}>{actorIcon[actor]}</span>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {count}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                    {actor}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: "0 0 260px" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search event types…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {actors.map((a) => (
              <button
                key={a}
                onClick={() => setActorFilter(a)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: actorFilter === a ? "var(--blue)" : "var(--border-dim)",
                  background: actorFilter === a ? "var(--blue-dim)" : "var(--bg-elevated)",
                  color: actorFilter === a ? "var(--blue)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {a === "ALL" ? "All" : a}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingState loading />
        ) : error ? (
          <LoadingState error={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <LoadingState empty emptyMessage="No audit events match your filters." />
        ) : viewMode === "timeline" ? (
          /* Timeline view */
          <div className="card" style={{ padding: "24px 28px" }}>
            <div className="timeline">
              {filtered.map((ev) => (
                <div key={ev.id} className="timeline-item">
                  <div
                    className={`timeline-dot ${
                      ev.actorType === "AI"
                        ? "purple"
                        : ev.actorType === "SYSTEM"
                        ? "blue"
                        : ev.actorType === "MERCHANT"
                        ? "gold"
                        : "muted"
                    }`}
                    style={
                      ev.actorType === "AI"
                        ? { background: "var(--purple)" }
                        : ev.actorType === "MERCHANT"
                        ? { background: "var(--gold)" }
                        : {}
                    }
                  />
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          marginBottom: 4,
                        }}
                      >
                        {ev.eventType.replace(/_/g, " ")}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`badge ${actorBadge(ev.actorType)}`} style={{ fontSize: 10 }}>
                          {actorIcon[ev.actorType]} {ev.actorType}
                        </span>
                        {ev.recoveryCaseId && (
                          <Link
                            href={`/recovery-cases/${ev.recoveryCaseId}`}
                            style={{ fontSize: 11, color: "var(--blue)" }}
                          >
                            Case: {shortId(ev.recoveryCaseId)}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, textAlign: "right" }}>
                      <div>{timeAgo(ev.createdAt)}</div>
                      <div style={{ marginTop: 2 }}>{formatDateTime(ev.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Table view */
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Event Type</th>
                  <th>Actor</th>
                  <th>Case</th>
                  <th>Merchant</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr key={ev.id}>
                    <td><span className="truncate-id">{shortId(ev.id)}</span></td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {ev.eventType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${actorBadge(ev.actorType)}`} style={{ fontSize: 11 }}>
                        {actorIcon[ev.actorType]} {ev.actorType}
                      </span>
                    </td>
                    <td>
                      {ev.recoveryCaseId ? (
                        <Link href={`/recovery-cases/${ev.recoveryCaseId}`} style={{ color: "var(--blue)", fontSize: 12 }}>
                          {shortId(ev.recoveryCaseId)}
                        </Link>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td><span className="truncate-id">{shortId(ev.merchantId)}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {timeAgo(ev.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
