"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Merchant, Policy } from "@/lib/types";
import LoadingState from "@/components/LoadingState";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCooldown(seconds: number): string {
  if (seconds < 60)    return `${seconds}s`;
  if (seconds < 3600)  return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

const ACTION_META: Record<string, { icon: string; color: string; desc: string }> = {
  RETRY_PAYMENT: {
    icon: "🔁",
    color: "var(--blue)",
    desc: "Automatically retry the failed payment with the same method.",
  },
  SEND_PAYMENT_REMINDER: {
    icon: "📧",
    color: "var(--gold)",
    desc: "Send a payment reminder email to the customer.",
  },
  REQUEST_PAYMENT_METHOD_UPDATE: {
    icon: "💳",
    color: "var(--purple)",
    desc: "Ask the customer to update their payment method.",
  },
  SEND_CHECKOUT_REMINDER: {
    icon: "🛒",
    color: "var(--orange)",
    desc: "Send a reminder to complete an abandoned checkout.",
  },
  OFFER_RECOVERY_INCENTIVE: {
    icon: "🎁",
    color: "var(--green)",
    desc: "Offer a discount or incentive to recover the payment.",
  },
  NO_ACTION: {
    icon: "⏸️",
    color: "var(--text-muted)",
    desc: "Take no action — used for high-risk or ineligible cases.",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PoliciesPage() {
  const [merchants,   setMerchants]   = useState<Merchant[]>([]);
  const [merchantId,  setMerchantId]  = useState("");
  const [policies,    setPolicies]    = useState<Policy[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Load merchants
  useEffect(() => {
    api.merchants.list().then((list) => {
      setMerchants(list);
      if (list.length > 0) setMerchantId(list[0].id);
    }).catch(() => {});
  }, []);

  // Load policies when merchant selected
  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.policies.byMerchant(merchantId);
      setPolicies(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load policies. Make sure the /policies backend endpoint is registered in app.ts."
      );
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => { load(); }, [load]);

  const selectedMerchant = merchants.find((m) => m.id === merchantId);
  const enabled  = policies.filter((p) => p.enabled);
  const disabled = policies.filter((p) => !p.enabled);

  return (
    <>
      <div className="page-header">
        <Shield size={18} color="var(--orange)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Policy Engine</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Deterministic guardrails that govern every AI strategy decision
          </div>
        </div>
        <select
          className="form-input"
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          style={{ width: 200, cursor: "pointer" }}
        >
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-body fade-in">

        {/* ── How the policy engine works ───────────────────────────── */}
        <div
          className="card"
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, rgba(77,122,247,0.06), var(--bg-surface))",
            borderColor: "rgba(77,122,247,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ fontSize: 32, flexShrink: 0 }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "var(--blue)" }}>
                How the Policy Engine Works
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Every AI strategy decision must pass <strong style={{ color: "var(--text-primary)" }}>4 sequential checks</strong>{" "}
                before a recovery action is created. If any check fails, the decision is{" "}
                <span style={{ color: "var(--red)", fontWeight: 600 }}>REJECTED</span> and the pipeline stops.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {[
                  { n: "1", label: "Policy exists & enabled",  color: "var(--blue)" },
                  { n: "2", label: "Amount ≤ maxAmount",        color: "var(--gold)" },
                  { n: "3", label: "Attempts < maxAttempts",    color: "var(--orange)" },
                  { n: "4", label: "Cooldown elapsed",          color: "var(--purple)" },
                ].map(({ n, label, color }) => (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: `${color}15`,
                      border: `1px solid ${color}40`,
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      color,
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: color,
                        color: "#0a0c14",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {n}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary row ───────────────────────────────────────────── */}
        {policies.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
              marginBottom: 24,
            }}
          >
            <div className="metric-card blue">
              <div className="metric-value" style={{ color: "var(--blue)", fontSize: 28 }}>
                {policies.length}
              </div>
              <div className="metric-label">Total Policies</div>
              <div className="metric-sub">for {selectedMerchant?.name}</div>
            </div>
            <div className="metric-card green">
              <div className="metric-value" style={{ color: "var(--green)", fontSize: 28 }}>
                {enabled.length}
              </div>
              <div className="metric-label">Active</div>
              <div className="metric-sub">accepting AI strategies</div>
            </div>
            <div className="metric-card red">
              <div className="metric-value" style={{ color: "var(--red)", fontSize: 28 }}>
                {disabled.length}
              </div>
              <div className="metric-label">Disabled</div>
              <div className="metric-sub">all strategies rejected</div>
            </div>
          </div>
        )}

        {/* ── Policy cards ──────────────────────────────────────────── */}
        {loading || error || policies.length === 0 ? (
          <LoadingState
            loading={loading}
            error={error}
            empty={!loading && !error && policies.length === 0}
            emptyMessage="No policies found for this merchant."
            onRetry={load}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 16,
            }}
          >
            {policies.map((policy) => {
              const meta = ACTION_META[policy.actionType] ?? {
                icon: "⚙️",
                color: "var(--text-muted)",
                desc: "",
              };

              return (
                <div
                  key={policy.id}
                  className="card"
                  style={{
                    borderColor: policy.enabled ? `${meta.color}40` : "var(--border-dim)",
                    opacity: policy.enabled ? 1 : 0.65,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0,
                      height: 3,
                      background: policy.enabled ? meta.color : "var(--border-dim)",
                    }}
                  />

                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 14,
                      paddingTop: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `${meta.color}20`,
                          border: `1px solid ${meta.color}40`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: meta.color }}>
                          {policy.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {policy.actionType.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 600,
                        color: policy.enabled ? "var(--green)" : "var(--red)",
                        background: policy.enabled ? "var(--green-dim)" : "var(--red-dim)",
                        padding: "3px 9px",
                        borderRadius: 100,
                      }}
                    >
                      {policy.enabled ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                      {policy.enabled ? "ACTIVE" : "DISABLED"}
                    </div>
                  </div>

                  {/* Description */}
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    {meta.desc}
                  </div>

                  {/* Guardrail grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <GuardrailCell
                      label="Max Amount"
                      value={policy.maxAmount ? `₹${Number(policy.maxAmount).toLocaleString("en-IN")}` : "Unlimited"}
                      icon="💰"
                      active={!!policy.maxAmount}
                      description="Maximum recovery value this policy will process"
                    />
                    <GuardrailCell
                      label="Max Attempts"
                      value={policy.maxAttempts != null ? String(policy.maxAttempts) : "Unlimited"}
                      icon="🔄"
                      active={policy.maxAttempts != null}
                      description="Max times this action can be attempted per case"
                    />
                    <GuardrailCell
                      label="Cooldown"
                      value={policy.cooldownSeconds != null ? formatCooldown(policy.cooldownSeconds) : "None"}
                      icon="⏱️"
                      active={policy.cooldownSeconds != null}
                      description="Minimum wait between consecutive attempts"
                    />
                    <GuardrailCell
                      label="Check #"
                      value={policy.enabled ? "Will run" : "Blocked"}
                      icon="🛡️"
                      active={policy.enabled}
                      description="Policy existence & enabled status (Check 1)"
                    />
                  </div>

                  {/* Configuration JSON (collapsed) */}
                  {policy.configuration &&
                    Object.keys(policy.configuration).length > 0 && (
                    <details style={{ marginTop: 4 }}>
                      <summary
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          userSelect: "none",
                          padding: "4px 0",
                        }}
                      >
                        Configuration ▸
                      </summary>
                      <pre
                        className="code-block"
                        style={{ marginTop: 8, fontSize: 11 }}
                      >
                        {JSON.stringify(policy.configuration, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Rejection scenarios explainer ─────────────────────────── */}
        {policies.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: "var(--orange)" }}>
              ⚠️ When the Policy Engine Rejects a Strategy
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              {[
                {
                  check: "No policy found",
                  detail: "AI chose an action type that has no merchant policy configured",
                  color: "var(--red)",
                },
                {
                  check: "Policy disabled",
                  detail: "The relevant policy exists but is marked enabled: false",
                  color: "var(--red)",
                },
                {
                  check: "Amount exceeded",
                  detail: "estimatedRecovery > policy.maxAmount for the case",
                  color: "var(--orange)",
                },
                {
                  check: "Max attempts hit",
                  detail: "Prior actions for this case already reached the limit",
                  color: "var(--orange)",
                },
                {
                  check: "Cooldown active",
                  detail: "The last action for this strategy ran too recently",
                  color: "var(--gold)",
                },
              ].map(({ check, detail, color }) => (
                <div
                  key={check}
                  style={{
                    background: `${color}10`,
                    border: `1px solid ${color}30`,
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 6 }}>
                    {check}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function GuardrailCell({
  label,
  value,
  icon,
  active,
  description,
}: {
  label: string;
  value: string;
  icon: string;
  active: boolean;
  description: string;
}) {
  return (
    <div
      title={description}
      style={{
        background: active ? "var(--bg-elevated)" : "var(--bg-base)",
        border: "1px solid var(--border-dim)",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "help",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 14,
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          color: active ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
