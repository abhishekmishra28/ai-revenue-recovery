"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { FlaskConical, ChevronRight, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import type { Merchant, ScenarioInput, SimulateResponse, ScenarioEventType } from "@/lib/types";
import { formatCurrency, confidencePct, riskBadge, decisionBadge, outcomeBadge } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingState";

// ─── Pipeline stage definitions ───────────────────────────────────────────────
const STAGES = [
  { key: "event",       label: "Revenue Event",      sub: "Creating event...",              icon: "⚡", color: "var(--gold)" },
  { key: "case",        label: "Recovery Case",       sub: "Detecting opportunity...",       icon: "📋", color: "var(--blue)" },
  { key: "ai",          label: "AI Strategy Engine",  sub: "Gemini Flash analyzing...",      icon: "🧠", color: "var(--purple)" },
  { key: "policy",      label: "Policy Engine",       sub: "Validating guardrails...",       icon: "🛡️", color: "var(--orange)" },
  { key: "action",      label: "Recovery Action",     sub: "Creating action...",             icon: "⚙️", color: "var(--blue)" },
  { key: "execution",   label: "Execution",           sub: "Executing with provider...",     icon: "▶️", color: "var(--green)" },
  { key: "attribution", label: "Revenue Attribution", sub: "Attributing recovered revenue...",icon: "💰", color: "var(--gold)" },
] as const;

type StageKey = typeof STAGES[number]["key"];

// Staggered reveal timing while the API call is in-flight
const STAGE_DELAYS_MS = [0, 300, 700, 0, 0, 0, 0]; // AI onwards are revealed post-resolve

type StageStatus = "idle" | "active" | "done" | "skipped" | "failed";

interface StageState {
  status: StageStatus;
  data?: Record<string, string | null | undefined>;
}

type PhaseType = "idle" | "running" | "done" | "error";

interface RunState {
  phase: PhaseType;
  stages: Record<StageKey, StageState>;
  result?: SimulateResponse;
  error?: string;
}

const defaultStages = (): Record<StageKey, StageState> =>
  Object.fromEntries(STAGES.map((s) => [s.key, { status: "idle" }])) as Record<StageKey, StageState>;

// ─── Failure codes per method ─────────────────────────────────────────────────
const FAILURE_CODES: Record<string, { code: string; reason: string }[]> = {
  CARD: [
    { code: "BANK_TIMEOUT",        reason: "Issuer response timed out" },
    { code: "CARD_EXPIRED",        reason: "Customer card has expired" },
    { code: "INSUFFICIENT_FUNDS",  reason: "Insufficient funds in account" },
    { code: "CARD_BLOCKED",        reason: "Card blocked by issuer" },
    { code: "DO_NOT_HONOUR",       reason: "Generic bank decline" },
  ],
  UPI: [
    { code: "UPI_TIMEOUT",         reason: "UPI payment timed out" },
    { code: "UPI_DECLINED",        reason: "Declined by customer's bank" },
    { code: "INVALID_VPA",         reason: "VPA not found" },
  ],
  NET_BANKING: [
    { code: "SESSION_EXPIRED",     reason: "Net banking session expired" },
    { code: "BANK_OFFLINE",        reason: "Bank temporarily offline" },
  ],
  WALLET: [
    { code: "WALLET_INSUFFICIENT", reason: "Wallet balance too low" },
    { code: "WALLET_BLOCKED",      reason: "Wallet account blocked" },
  ],
};

const SUBSCRIPTION_PLANS = ["BASIC", "PRO", "ENTERPRISE", "STARTER"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SimulatePage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [form, setForm] = useState<ScenarioInput>({
    merchantId: "",
    eventType: "PAYMENT_FAILED",
    amount: 2499,
    currency: "INR",
    paymentMethod: "CARD",
    failureCode: "BANK_TIMEOUT",
    failureReason: "Issuer response timed out",
  });
  const [run, setRun] = useState<RunState>({
    phase: "idle",
    stages: defaultStages(),
  });

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Load merchants on mount
  useEffect(() => {
    api.merchants.list().then((list) => {
      setMerchants(list);
      if (list.length > 0) {
        setForm((f) => ({ ...f, merchantId: list[0].id }));
      }
    }).catch(() => {});
  }, []);

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const reset = () => {
    clearTimers();
    setRun({ phase: "idle", stages: defaultStages() });
  };

  // ─── Update failure code when payment method changes ──────────────────────
  const setPaymentMethod = (pm: string) => {
    const codes = FAILURE_CODES[pm] ?? [];
    const first = codes[0];
    setForm((f) => ({
      ...f,
      paymentMethod: pm as ScenarioInput["paymentMethod"],
      failureCode: first?.code,
      failureReason: first?.reason,
    }));
  };

  const setFailureCode = (code: string) => {
    const pm = form.paymentMethod ?? "CARD";
    const entry = (FAILURE_CODES[pm] ?? []).find((c) => c.code === code);
    setForm((f) => ({
      ...f,
      failureCode: code,
      failureReason: entry?.reason ?? code,
    }));
  };

  // ─── Main run function ────────────────────────────────────────────────────
  const runSimulation = useCallback(async () => {
    if (!form.merchantId) return;
    clearTimers();

    const stages = defaultStages();
    setRun({ phase: "running", stages });

    // Animate first two stages while API is in flight
    const showStage = (key: StageKey, delay: number) => {
      const t = setTimeout(() => {
        setRun((prev) => ({
          ...prev,
          stages: {
            ...prev.stages,
            [key]: { status: "active" },
          },
        }));
      }, delay);
      timerRefs.current.push(t);
    };

    showStage("event", 0);
    showStage("case",  300);
    showStage("ai",    700);

    try {
      const result = await api.simulate.runScenario(form);

      // Resolve stages based on pipeline result
      const resolvedStages = resolveStages(result);

      // Reveal post-AI stages with short stagger after API resolves
      const postAiKeys: StageKey[] = ["policy", "action", "execution", "attribution"];
      postAiKeys.forEach((key, i) => {
        const t = setTimeout(() => {
          setRun((prev) => ({
            ...prev,
            stages: {
              ...prev.stages,
              [key]: resolvedStages[key],
            },
          }));
        }, i * 300);
        timerRefs.current.push(t);
      });

      // Mark pre-AI stages as done immediately
      const finalStages: Record<StageKey, StageState> = {
        ...resolvedStages,
        policy:      { status: "idle" },
        action:      { status: "idle" },
        execution:   { status: "idle" },
        attribution: { status: "idle" },
      };

      setRun({
        phase: "done",
        stages: finalStages,
        result,
      });

      // Then reveal post-AI stages (already scheduled above)
      setTimeout(() => {
        setRun((prev) => ({
          ...prev,
          stages: resolvedStages,
        }));
      }, postAiKeys.length * 300 + 100);

    } catch (err) {
      setRun({
        phase: "error",
        stages: defaultStages(),
        error: err instanceof Error ? err.message : "Simulation failed",
      });
    }
  }, [form]);

  return (
    <>
      <div className="page-header">
        <FlaskConical size={18} color="var(--gold)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Scenario Simulator
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Inject a live event and watch every pipeline stage execute in real time
          </div>
        </div>
      </div>

      <div className="page-body fade-in">
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>

          {/* ── Left: Scenario Form ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
                Configure Scenario
              </div>

              {/* Merchant */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Merchant</label>
                <select
                  className="form-input"
                  value={form.merchantId}
                  onChange={(e) => setForm((f) => ({ ...f, merchantId: e.target.value }))}
                  style={{ cursor: "pointer" }}
                >
                  {merchants.length === 0 && (
                    <option value="">Loading merchants…</option>
                  )}
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Event Type</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(
                    [
                      { value: "PAYMENT_FAILED",              icon: "💳", label: "Failed Payment",      sub: "Retry, reminder, or method update" },
                      { value: "CHECKOUT_ABANDONED",          icon: "🛒", label: "Checkout Abandoned",  sub: "Reminder to complete purchase" },
                      { value: "SUBSCRIPTION_PAYMENT_FAILED", icon: "🔄", label: "Subscription Failed", sub: "Reminder or method update" },
                    ] as const
                  ).map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          eventType: opt.value as ScenarioEventType,
                          failureCode: opt.value === "PAYMENT_FAILED" ? (FAILURE_CODES[f.paymentMethod ?? "CARD"]?.[0]?.code) : undefined,
                          failureReason: opt.value === "PAYMENT_FAILED" ? (FAILURE_CODES[f.paymentMethod ?? "CARD"]?.[0]?.reason) : undefined,
                        }))
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor: form.eventType === opt.value ? "var(--gold)" : "var(--border-dim)",
                        background: form.eventType === opt.value ? "var(--gold-dim)" : "var(--bg-elevated)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: form.eventType === opt.value ? "var(--gold)" : "var(--text-primary)" }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{opt.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Amount (INR)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.amount}
                  min={100}
                  max={50000}
                  step={100}
                  onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  {[499, 2499, 5999, 12999].map((v) => (
                    <button
                      key={v}
                      onClick={() => setForm((f) => ({ ...f, amount: v }))}
                      style={{
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 5,
                        border: "1px solid var(--border-dim)",
                        background: form.amount === v ? "var(--gold-dim)" : "var(--bg-elevated)",
                        color: form.amount === v ? "var(--gold)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      ₹{v.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional: Payment method + failure code */}
              {form.eventType === "PAYMENT_FAILED" && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">Payment Method</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(["CARD", "UPI", "NET_BANKING", "WALLET"] as const).map((pm) => (
                        <button
                          key={pm}
                          onClick={() => setPaymentMethod(pm)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 8,
                            border: "1px solid",
                            borderColor: form.paymentMethod === pm ? "var(--blue)" : "var(--border-dim)",
                            background: form.paymentMethod === pm ? "var(--blue-dim)" : "var(--bg-elevated)",
                            color: form.paymentMethod === pm ? "var(--blue)" : "var(--text-secondary)",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          {pm.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">Failure Code</label>
                    <select
                      className="form-input"
                      value={form.failureCode}
                      onChange={(e) => setFailureCode(e.target.value)}
                    >
                      {(FAILURE_CODES[form.paymentMethod ?? "CARD"] ?? []).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.reason}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Conditional: Subscription plan */}
              {form.eventType === "SUBSCRIPTION_PAYMENT_FAILED" && (
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Subscription Plan</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setForm((f) => ({ ...f, subscriptionPlan: plan }))}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: form.subscriptionPlan === plan ? "var(--purple)" : "var(--border-dim)",
                          background: form.subscriptionPlan === plan ? "var(--purple-dim)" : "var(--bg-elevated)",
                          color: form.subscriptionPlan === plan ? "var(--purple)" : "var(--text-secondary)",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional: Checkout items */}
              {form.eventType === "CHECKOUT_ABANDONED" && (
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Cart Items</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.checkoutItems ?? 1}
                    min={1}
                    max={20}
                    onChange={(e) => setForm((f) => ({ ...f, checkoutItems: Number(e.target.value) }))}
                  />
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={runSimulation}
                  disabled={run.phase === "running" || !form.merchantId}
                  style={{ flex: 1 }}
                >
                  {run.phase === "running" ? (
                    <><LoadingSpinner size="sm" /> Running…</>
                  ) : (
                    <><FlaskConical size={14} /> Run Simulation</>
                  )}
                </button>
                {run.phase !== "idle" && (
                  <button className="btn btn-ghost" onClick={reset}>
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Result summary card */}
            {run.phase === "done" && run.result && (
              <ResultSummary result={run.result} />
            )}
          </div>

          {/* ── Right: Pipeline Visualization ──────────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Live Pipeline Execution
              </span>
              {run.phase === "running" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--gold)" }}>
                  <LoadingSpinner size="sm" />
                  Pipeline running…
                </div>
              )}
              {run.phase === "done" && run.result && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {run.result.meta.durationMs}ms total
                </div>
              )}
              {run.phase === "error" && (
                <span style={{ fontSize: 12, color: "var(--red)" }}>Failed</span>
              )}
            </div>

            {run.phase === "idle" ? (
              <div style={{ padding: "60px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                  Configure a scenario and click Run
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  Each stage will animate as the pipeline executes
                </div>
              </div>
            ) : run.phase === "error" ? (
              <div style={{ padding: "48px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
                <div style={{ fontSize: 14, color: "var(--red)" }}>{run.error}</div>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {STAGES.map((stage, i) => {
                  const state = run.stages[stage.key];
                  const result = run.result;
                  return (
                    <PipelineStageRow
                      key={stage.key}
                      stage={stage}
                      state={state}
                      result={result}
                      isLast={i === STAGES.length - 1}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Stage row component ──────────────────────────────────────────────────────
function PipelineStageRow({
  stage,
  state,
  result,
  isLast,
}: {
  stage: typeof STAGES[number];
  state: StageState;
  result?: SimulateResponse;
  isLast: boolean;
}) {
  const isDone    = state.status === "done";
  const isActive  = state.status === "active";
  const isSkipped = state.status === "skipped";
  const isFailed  = state.status === "failed";
  const isIdle    = state.status === "idle";

  const borderColor = isDone
    ? stage.color
    : isActive
    ? stage.color
    : isFailed
    ? "var(--red)"
    : "var(--border-dim)";

  const bgColor = isDone
    ? `${stage.color}10`
    : isActive
    ? `${stage.color}18`
    : "transparent";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          padding: "14px 20px",
          borderLeft: `3px solid ${borderColor}`,
          background: bgColor,
          transition: "all 0.3s ease",
          borderBottom: isLast ? "none" : "1px solid var(--border-dim)",
          opacity: isIdle ? 0.4 : 1,
        }}
      >
        {/* Icon + status */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isDone || isActive ? `${stage.color}20` : "var(--bg-elevated)",
            border: `1px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
            transition: "all 0.3s",
          }}
        >
          {isActive ? <LoadingSpinner size="sm" /> : stage.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: isDone ? stage.color : isActive ? stage.color : "var(--text-secondary)",
              }}
            >
              {stage.label}
            </span>
            <StatusPip status={state.status} />
          </div>

          {isActive && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              {stage.sub}
            </div>
          )}

          {/* Stage-specific data revealed after done */}
          {isDone && result && (
            <StageData stageKey={stage.key} result={result} color={stage.color} />
          )}
          {isSkipped && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              Skipped — pipeline stopped before this stage
            </div>
          )}
          {isFailed && (
            <div style={{ fontSize: 12, color: "var(--red)" }}>
              Stage failed — see result above
            </div>
          )}
        </div>
      </div>
      {/* Connector line */}
      {!isLast && (
        <div
          style={{
            height: 0,
            marginLeft: 38,
            borderLeft: `2px dashed ${isDone ? stage.color + "50" : "var(--border-dim)"}`,
            transition: "border-color 0.4s",
          }}
        />
      )}
    </div>
  );
}

function StatusPip({ status }: { status: StageStatus }) {
  const map: Record<StageStatus, { color: string; label: string }> = {
    idle:    { color: "var(--text-muted)",      label: "waiting" },
    active:  { color: "var(--gold)",            label: "running" },
    done:    { color: "var(--green)",           label: "done" },
    skipped: { color: "var(--text-muted)",      label: "skipped" },
    failed:  { color: "var(--red)",             label: "failed" },
  };
  const { color, label } = map[status];
  if (status === "idle") return null;
  return (
    <span
      style={{
        fontSize: 10,
        color,
        fontWeight: 600,
        background: `${color}20`,
        padding: "1px 7px",
        borderRadius: 100,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

// ─── Per-stage data display ───────────────────────────────────────────────────
function StageData({ stageKey, result, color }: { stageKey: StageKey; result: SimulateResponse; color: string }) {
  const items: { label: string; value: string; mono?: boolean; badge?: string }[] = [];

  switch (stageKey) {
    case "event":
      if (result.event) {
        items.push({ label: "Event ID",   value: result.event.id.slice(0, 18) + "…", mono: true });
        items.push({ label: "Type",       value: result.event.eventType.replace(/_/g, " ") });
        items.push({ label: "Processed",  value: result.event.processedAt ? "✓ Yes" : "✗ No" });
      }
      break;
    case "case":
      if (result.recoveryCase) {
        items.push({ label: "Type",      value: result.recoveryCase.caseType.replace(/_/g, " ") });
        items.push({ label: "Priority",  value: result.recoveryCase.priority });
        items.push({ label: "Est. Revenue", value: formatCurrency(result.recoveryCase.estimatedRecovery ?? "0", result.recoveryCase.currency) });
      } else {
        items.push({ label: "Result", value: "No recovery required" });
      }
      break;
    case "ai": {
      const d = result.validatedDecision ?? result.strategyDecision;
      if (d) {
        items.push({ label: "Decision",    value: d.decision.replace(/_/g, " ") });
        items.push({ label: "Confidence",  value: confidencePct(d.confidence), mono: true });
        items.push({ label: "Risk",        value: d.riskLevel });
        items.push({ label: "Model",       value: d.model, mono: true });
      }
      break;
    }
    case "policy": {
      const d = result.validatedDecision ?? result.strategyDecision;
      if (d) {
        items.push({ label: "Decision", value: d.status === "VALIDATED" ? "✓ All checks passed" : "✗ Rejected by policy", badge: d.status === "VALIDATED" ? "badge badge-green" : "badge badge-red" });
        items.push({ label: "Status",   value: d.status });
      }
      break;
    }
    case "action":
      if (result.recoveryAction) {
        items.push({ label: "Type",   value: result.recoveryAction.actionType.replace(/_/g, " ") });
        items.push({ label: "Status", value: result.recoveryAction.status });
      }
      break;
    case "execution":
      if (result.outcome) {
        items.push({ label: "Outcome",   value: result.outcome.status.replace(/_/g, " ") });
        if (result.outcome.recoveredAmount) {
          items.push({ label: "Recovered", value: formatCurrency(result.outcome.recoveredAmount, result.outcome.currency), mono: true });
        }
      } else if (result.recoveryAction) {
        items.push({ label: "Status", value: result.recoveryAction.status });
      }
      break;
    case "attribution":
      if (result.attribution) {
        items.push({ label: "Amount",  value: formatCurrency(result.attribution.amount, result.attribution.currency), mono: true });
        items.push({ label: "Type",    value: result.attribution.attributionType });
      } else {
        items.push({ label: "Result", value: "No attribution (no successful outcome)" });
      }
      break;
  }

  if (items.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-dim)",
            borderRadius: 7,
            padding: "5px 10px",
          }}
        >
          <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {item.label}
          </div>
          {item.badge ? (
            <span className={item.badge} style={{ fontSize: 11 }}>{item.value}</span>
          ) : (
            <div
              style={{
                fontSize: 12,
                fontFamily: item.mono ? "var(--font-mono)" : undefined,
                color,
                fontWeight: 500,
              }}
            >
              {item.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Result summary card ──────────────────────────────────────────────────────
function ResultSummary({ result }: { result: SimulateResponse }) {
  const statusMeta: Record<string, { icon: string; color: string; label: string }> = {
    RECOVERY_SUCCEEDED:   { icon: "✅", color: "var(--green)",  label: "Recovered!" },
    RECOVERY_FAILED:      { icon: "❌", color: "var(--red)",    label: "Recovery Failed" },
    POLICY_REJECTED:      { icon: "🛡️", color: "var(--orange)", label: "Policy Rejected" },
    NO_RECOVERY_REQUIRED: { icon: "ℹ️", color: "var(--blue)",   label: "No Action Needed" },
    ALREADY_PROCESSED:    { icon: "♻️", color: "var(--text-muted)", label: "Already Processed" },
  };
  const meta = statusMeta[result.status] ?? { icon: "❓", color: "var(--text-muted)", label: result.status };

  return (
    <div
      className="card"
      style={{ borderColor: meta.color, background: `${meta.color}10` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{meta.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: meta.color }}>{meta.label}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {result.meta.durationMs}ms · {result.meta.merchantName}
          </div>
        </div>
      </div>
      {result.attribution && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--gold)",
            letterSpacing: "-0.02em",
          }}
        >
          {formatCurrency(result.attribution.amount, result.attribution.currency)}
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>
            recovered
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Stage resolver ───────────────────────────────────────────────────────────
function resolveStages(result: SimulateResponse): Record<StageKey, StageState> {
  const stages = defaultStages();

  stages.event = { status: result.event ? "done" : "failed" };

  if (!result.recoveryCase) {
    stages.case        = { status: "done" };
    stages.ai          = { status: "skipped" };
    stages.policy      = { status: "skipped" };
    stages.action      = { status: "skipped" };
    stages.execution   = { status: "skipped" };
    stages.attribution = { status: "skipped" };
    return stages;
  }

  stages.case = { status: "done" };
  stages.ai   = { status: result.strategyDecision ? "done" : "failed" };

  if (!result.strategyDecision || result.status === "POLICY_REJECTED") {
    stages.policy      = { status: "done" };
    stages.action      = { status: "skipped" };
    stages.execution   = { status: "skipped" };
    stages.attribution = { status: "skipped" };
    return stages;
  }

  stages.policy    = { status: "done" };
  stages.action    = { status: result.recoveryAction ? "done" : "failed" };
  stages.execution = { status: result.outcome ? "done" : "failed" };
  stages.attribution = {
    status: result.attribution ? "done" : "skipped",
  };

  return stages;
}
