"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Layers,
  Play,
  RotateCcw,
  OctagonX,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import type {
  Merchant,
  ScenarioInput,
  ScenarioEventType,
  BatchItem,
  SimulateResponse,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingState";

// ─── Scenario generation ──────────────────────────────────────────────────────
const FAILURE_CODES: Record<string, { code: string; reason: string }[]> = {
  CARD: [
    { code: "BANK_TIMEOUT",       reason: "Issuer response timed out" },
    { code: "CARD_EXPIRED",       reason: "Customer card has expired" },
    { code: "INSUFFICIENT_FUNDS", reason: "Insufficient funds in account" },
    { code: "DO_NOT_HONOUR",      reason: "Generic bank decline" },
  ],
  UPI: [
    { code: "UPI_TIMEOUT",  reason: "UPI payment timed out" },
    { code: "UPI_DECLINED", reason: "Declined by customer's bank" },
  ],
};

const AMOUNTS = [499, 999, 1499, 2499, 3999, 5499, 7999, 12999];
const PLANS   = ["BASIC", "PRO", "ENTERPRISE"];

type Distribution = "mixed" | "payment_failed" | "checkout" | "subscription";

function generateScenarios(
  merchantId: string,
  count: number,
  distribution: Distribution
): ScenarioInput[] {
  const typePool: ScenarioEventType[] =
    distribution === "payment_failed"  ? ["PAYMENT_FAILED", "PAYMENT_FAILED", "PAYMENT_FAILED", "PAYMENT_FAILED"]
    : distribution === "checkout"      ? ["CHECKOUT_ABANDONED", "CHECKOUT_ABANDONED", "CHECKOUT_ABANDONED", "CHECKOUT_ABANDONED"]
    : distribution === "subscription"  ? ["SUBSCRIPTION_PAYMENT_FAILED", "SUBSCRIPTION_PAYMENT_FAILED", "SUBSCRIPTION_PAYMENT_FAILED", "SUBSCRIPTION_PAYMENT_FAILED"]
    : ["PAYMENT_FAILED", "PAYMENT_FAILED", "CHECKOUT_ABANDONED", "SUBSCRIPTION_PAYMENT_FAILED"];

  return Array.from({ length: count }, (_, i) => {
    const eventType = typePool[i % typePool.length];
    const amount    = AMOUNTS[i % AMOUNTS.length];

    const scenario: ScenarioInput = {
      merchantId,
      eventType,
      amount,
      currency: "INR",
    };

    if (eventType === "PAYMENT_FAILED") {
      const pm    = i % 3 === 0 ? "UPI" : "CARD";
      const codes = FAILURE_CODES[pm];
      const pick  = codes[i % codes.length];
      scenario.paymentMethod = pm as ScenarioInput["paymentMethod"];
      scenario.failureCode   = pick.code;
      scenario.failureReason = pick.reason;
    }

    if (eventType === "SUBSCRIPTION_PAYMENT_FAILED") {
      scenario.subscriptionPlan = PLANS[i % PLANS.length];
    }

    if (eventType === "CHECKOUT_ABANDONED") {
      scenario.checkoutItems = (i % 5) + 1;
    }

    return scenario;
  });
}

function scenarioLabel(s: ScenarioInput): string {
  if (s.eventType === "PAYMENT_FAILED")             return `${s.paymentMethod} · ${s.failureCode}`;
  if (s.eventType === "CHECKOUT_ABANDONED")          return `Checkout · ${s.checkoutItems} item${(s.checkoutItems ?? 1) > 1 ? "s" : ""}`;
  if (s.eventType === "SUBSCRIPTION_PAYMENT_FAILED") return `Subscription · ${s.subscriptionPlan ?? "PRO"}`;
  return s.eventType;
}

function eventTypeIcon(t: ScenarioEventType) {
  if (t === "PAYMENT_FAILED")             return "💳";
  if (t === "CHECKOUT_ABANDONED")          return "🛒";
  if (t === "SUBSCRIPTION_PAYMENT_FAILED") return "🔄";
  return "⚡";
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusMeta: Record<string, { icon: string; color: string; label: string }> = {
  queued:                { icon: "○",  color: "var(--text-muted)",  label: "Queued" },
  running:               { icon: "⟳",  color: "var(--gold)",        label: "Running" },
  RECOVERY_SUCCEEDED:    { icon: "✓",  color: "var(--green)",       label: "Succeeded" },
  RECOVERY_FAILED:       { icon: "✗",  color: "var(--red)",         label: "Failed" },
  POLICY_REJECTED:       { icon: "🛡", color: "var(--orange)",      label: "Rejected" },
  NO_RECOVERY_REQUIRED:  { icon: "–",  color: "var(--blue)",        label: "No Action" },
  ALREADY_PROCESSED:     { icon: "♻", color: "var(--text-muted)",  label: "Duplicate" },
  error:                 { icon: "!",  color: "var(--red)",         label: "Error" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function BatchPage() {
  const [merchants, setMerchants]     = useState<Merchant[]>([]);
  const [merchantId, setMerchantId]   = useState("");
  const [count,      setCount]        = useState<number>(5);
  const [distribution, setDistrib]    = useState<Distribution>("mixed");
  const [stopAfter,  setStopAfter]    = useState<number>(3);
  const [delayMs,    setDelayMs]      = useState<number>(600);

  const [phase,    setPhase]    = useState<"config" | "running" | "done">("config");
  const [items,    setItems]    = useState<BatchItem[]>([]);
  const [stopped,  setStopped]  = useState(false);
  const [startTs,  setStartTs]  = useState(0);
  const [endTs,    setEndTs]    = useState(0);

  const abortRef = useRef(false);

  useEffect(() => {
    api.merchants.list().then((list) => {
      setMerchants(list);
      if (list.length > 0) setMerchantId(list[0].id);
    }).catch(() => {});
  }, []);

  const reset = () => {
    abortRef.current = true;
    setPhase("config");
    setItems([]);
    setStopped(false);
    setTimeout(() => { abortRef.current = false; }, 100);
  };

  const runBatch = useCallback(async () => {
    if (!merchantId) return;
    abortRef.current = false;

    const scenarios = generateScenarios(merchantId, count, distribution);
    const initial: BatchItem[] = scenarios.map((s, i) => ({
      id: `batch-${i}`,
      scenario: s,
      label: scenarioLabel(s),
      status: "queued",
    }));

    setItems(initial);
    setPhase("running");
    setStopped(false);
    setStartTs(Date.now());

    let consecutiveFails = 0;
    const updatedItems = [...initial];

    for (let i = 0; i < updatedItems.length; i++) {
      if (abortRef.current) break;

      // ── Mark current as running ──────────────────────────────────────
      updatedItems[i] = { ...updatedItems[i], status: "running" };
      setItems([...updatedItems]);

      const t0 = Date.now();

      try {
        const result: SimulateResponse = await api.simulate.runScenario(updatedItems[i].scenario);

        const recovered = result.attribution
          ? parseFloat(result.attribution.amount)
          : 0;

        updatedItems[i] = {
          ...updatedItems[i],
          status:       result.status as BatchItem["status"],
          result,
          durationMs:   Date.now() - t0,
          recoveredAmount: recovered,
        };

        // ── Stopping rule ────────────────────────────────────────────
        const isFail =
          result.status === "RECOVERY_FAILED" ||
          result.status === "POLICY_REJECTED";

        if (isFail) {
          consecutiveFails++;
          if (stopAfter > 0 && consecutiveFails >= stopAfter) {
            setItems([...updatedItems]);
            setStopped(true);
            break;
          }
        } else {
          consecutiveFails = 0;
        }

      } catch (err) {
        updatedItems[i] = {
          ...updatedItems[i],
          status:     "error",
          error:      err instanceof Error ? err.message : "Request failed",
          durationMs: Date.now() - t0,
        };
        consecutiveFails++;
        if (stopAfter > 0 && consecutiveFails >= stopAfter) {
          setItems([...updatedItems]);
          setStopped(true);
          break;
        }
      }

      setItems([...updatedItems]);

      // ── Inter-item delay (visual pacing) ─────────────────────────
      if (i < updatedItems.length - 1 && delayMs > 0 && !abortRef.current) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    setEndTs(Date.now());
    setPhase("done");
  }, [merchantId, count, distribution, stopAfter, delayMs]);

  // ─── Aggregate stats ─────────────────────────────────────────────────────
  const completed   = items.filter((it) => it.status !== "queued" && it.status !== "running");
  const succeeded   = completed.filter((it) => it.status === "RECOVERY_SUCCEEDED");
  const failed      = completed.filter((it) => it.status === "RECOVERY_FAILED");
  const rejected    = completed.filter((it) => it.status === "POLICY_REJECTED");
  const noAction    = completed.filter((it) => it.status === "NO_RECOVERY_REQUIRED" || it.status === "ALREADY_PROCESSED");
  const totalAmount = succeeded.reduce((s, it) => s + (it.recoveredAmount ?? 0), 0);
  const successRate = completed.length > 0 ? Math.round((succeeded.length / completed.length) * 100) : 0;
  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((s, it) => s + (it.durationMs ?? 0), 0) / completed.length)
    : 0;
  const totalDuration = endTs > 0 && startTs > 0 ? ((endTs - startTs) / 1000).toFixed(1) : "—";

  return (
    <>
      <div className="page-header">
        <Layers size={18} color="var(--blue)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Batch Runner</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Run multiple scenarios with stopping rules — measure recovery across a batch
          </div>
        </div>
        {phase !== "config" && (
          <button className="btn btn-ghost" onClick={reset}>
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      <div className="page-body fade-in">

        {/* ── Config panel (always visible at top) ─────────────────── */}
        {phase === "config" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Merchant + count */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Batch Setup</div>

              <label className="form-label">Merchant</label>
              <select
                className="form-input"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                style={{ marginBottom: 14, cursor: "pointer" }}
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <label className="form-label">Scenario Count</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[3, 5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: count === n ? "var(--blue)" : "var(--border-dim)",
                      background: count === n ? "var(--blue-dim)" : "var(--bg-elevated)",
                      color: count === n ? "var(--blue)" : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <label className="form-label">Delay Between Events</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { ms: 0,    label: "None" },
                  { ms: 600,  label: "0.6s" },
                  { ms: 1200, label: "1.2s" },
                ].map(({ ms, label }) => (
                  <button
                    key={ms}
                    onClick={() => setDelayMs(ms)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: delayMs === ms ? "var(--blue)" : "var(--border-dim)",
                      background: delayMs === ms ? "var(--blue-dim)" : "var(--bg-elevated)",
                      color: delayMs === ms ? "var(--blue)" : "var(--text-secondary)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distribution */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
                Event Distribution
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(
                  [
                    { value: "mixed",        icon: "🎲", label: "Mixed",                 sub: "25% each type" },
                    { value: "payment_failed", icon: "💳", label: "All Failed Payments",  sub: "Retry + method update" },
                    { value: "checkout",     icon: "🛒", label: "All Checkout Abandoned", sub: "Checkout reminders" },
                    { value: "subscription", icon: "🔄", label: "All Subscription",       sub: "Subscription recovery" },
                  ] as const
                ).map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setDistrib(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: distribution === opt.value ? "var(--gold)" : "var(--border-dim)",
                      background: distribution === opt.value ? "var(--gold-dim)" : "var(--bg-elevated)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: distribution === opt.value ? "var(--gold)" : "var(--text-primary)" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stopping rules */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <OctagonX size={15} color="var(--red)" />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Stopping Rules</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>
                Automatically halt the batch if too many consecutive scenarios fail or are rejected. Mirrors
                real production safeguards.
              </div>

              <label className="form-label">Stop After N Consecutive Failures</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {[
                  { n: 0, label: "Off" },
                  { n: 2, label: "2" },
                  { n: 3, label: "3" },
                  { n: 5, label: "5" },
                ].map(({ n, label }) => (
                  <button
                    key={n}
                    onClick={() => setStopAfter(n)}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: stopAfter === n ? "var(--red)" : "var(--border-dim)",
                      background: stopAfter === n ? "var(--red-dim)" : "var(--bg-elevated)",
                      color: stopAfter === n ? "var(--red)" : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                {stopAfter === 0
                  ? "No stopping rule — runs all scenarios regardless of outcome."
                  : `Batch will halt after ${stopAfter} consecutive FAILED or POLICY_REJECTED outcomes.`}
              </div>

              <button
                className="btn btn-primary"
                onClick={runBatch}
                disabled={!merchantId}
                style={{ width: "100%" }}
              >
                <Play size={14} />
                Run {count} Scenarios
              </button>
            </div>
          </div>
        )}

        {/* ── Running / Done stats bar ───────────────────────────────── */}
        {(phase === "running" || phase === "done") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <StatBox icon={<TrendingUp size={15} />} label="Recovered" value={formatCurrency(totalAmount, "INR")} color="var(--gold)" />
            <StatBox icon={<CheckCircle2 size={15} />} label="Succeeded" value={String(succeeded.length)} color="var(--green)" />
            <StatBox icon={<XCircle size={15} />} label="Failed" value={String(failed.length)} color="var(--red)" />
            <StatBox icon={<AlertTriangle size={15} />} label="Rejected" value={String(rejected.length)} color="var(--orange)" />
            <StatBox icon={<CheckCircle2 size={15} />} label="Success Rate" value={`${successRate}%`} color="var(--blue)" />
            <StatBox icon={<Clock size={15} />} label="Total Time" value={phase === "done" ? `${totalDuration}s` : "—"} color="var(--text-secondary)" />
          </div>
        )}

        {/* ── Stopped by rule banner ───────────────────────────────── */}
        {stopped && (
          <div
            className="card"
            style={{
              borderColor: "var(--red)",
              background: "var(--red-dim)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              padding: "14px 20px",
            }}
          >
            <OctagonX size={20} color="var(--red)" />
            <div>
              <div style={{ fontWeight: 600, color: "var(--red)", fontSize: 14 }}>
                Batch halted by stopping rule
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {stopAfter} consecutive failures detected — remaining scenarios were cancelled to prevent further damage.
              </div>
            </div>
          </div>
        )}

        {/* ── Batch items table ─────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                Batch Execution Log
              </div>
              {phase === "running" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--gold)" }}>
                  <LoadingSpinner size="sm" />
                  Processing {completed.length}/{items.length}…
                </div>
              )}
              {phase === "done" && (
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Avg {avgDuration}ms/event
                </span>
              )}
            </div>

            {/* Progress bar */}
            {phase === "running" && (
              <div style={{ height: 3, background: "var(--border-dim)" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(completed.length / items.length) * 100}%`,
                    background: "linear-gradient(90deg, var(--gold), var(--green))",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Scenario</th>
                  <th>Amount</th>
                  <th>AI Decision</th>
                  <th>Policy</th>
                  <th>Outcome</th>
                  <th>Recovered</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const meta  = statusMeta[item.status] ?? statusMeta.queued;
                  const d     = item.result?.validatedDecision ?? item.result?.strategyDecision;
                  const isRunning = item.status === "running";
                  return (
                    <tr
                      key={item.id}
                      style={{
                        opacity: item.status === "queued" ? 0.4 : 1,
                        transition: "opacity 0.3s",
                        background: isRunning ? "var(--gold-dim)" : undefined,
                      }}
                    >
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{eventTypeIcon(item.scenario.eventType)}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>
                              {item.scenario.eventType.replace(/_/g, " ")}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {item.label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          ₹{Number(item.scenario.amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        {isRunning ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--purple)", fontSize: 12 }}>
                            <LoadingSpinner size="sm" /> Analyzing…
                          </div>
                        ) : d ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{d.decision.replace(/_/g, " ")}</div>
                            <div style={{ fontSize: 11, color: "var(--purple)" }}>
                              {Math.round(parseFloat(d.confidence) * 100)}% confidence
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        {isRunning ? (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        ) : item.result?.validatedDecision?.status ? (
                          <span
                            className={`badge ${item.result.validatedDecision.status === "VALIDATED" ? "badge-green" : "badge-red"}`}
                            style={{ fontSize: 11 }}
                          >
                            {item.result.validatedDecision.status === "VALIDATED" ? "✓ Pass" : "✗ Rejected"}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        {isRunning ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: meta.color,
                            }}
                          >
                            {meta.icon} {meta.label}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            fontWeight: (item.recoveredAmount ?? 0) > 0 ? 700 : 400,
                            color: (item.recoveredAmount ?? 0) > 0 ? "var(--gold)" : "var(--text-muted)",
                          }}
                        >
                          {(item.recoveredAmount ?? 0) > 0
                            ? formatCurrency(item.recoveredAmount!, "INR")
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                          {item.durationMs != null ? `${item.durationMs}ms` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Final summary ─────────────────────────────────────────── */}
        {phase === "done" && completed.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
            {/* Distribution bar */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
                Outcome Distribution
              </div>
              {[
                { label: "Recovered",  count: succeeded.length,  color: "var(--green)" },
                { label: "Failed",     count: failed.length,     color: "var(--red)" },
                { label: "Rejected",   count: rejected.length,   color: "var(--orange)" },
                { label: "No Action",  count: noAction.length,   color: "var(--text-muted)" },
              ].map(({ label, count: cnt, color }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color }}>{cnt}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border-dim)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${completed.length > 0 ? (cnt / completed.length) * 100 : 0}%`,
                        background: color,
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recovered amount highlight */}
            <div
              className="card"
              style={{
                background: "linear-gradient(135deg, var(--gold-dim), var(--bg-surface))",
                borderColor: "var(--gold-glow)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Total Recovered This Batch
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--gold)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  marginBottom: 12,
                }}
              >
                {formatCurrency(totalAmount, "INR")}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>SUCCESS RATE</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>
                    {successRate}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>PROCESSED</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                    {completed.length}/{items.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>WALL TIME</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--blue)" }}>
                    {totalDuration}s
                  </div>
                </div>
              </div>
              {stopped && (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: "var(--red)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <OctagonX size={13} />
                  Halted after {stopAfter} consecutive failures
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card-sm" style={{ textAlign: "center" }}>
      <div style={{ color, display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color, marginBottom: 3 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
    </div>
  );
}
