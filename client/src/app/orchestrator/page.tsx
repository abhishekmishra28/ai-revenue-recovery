"use client";
import { useState } from "react";
import {
  Rocket,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import type { RecoveryPipelineResponse } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  confidencePct,
  formatDecision,
  caseStatusBadge,
  decisionBadge,
  actionStatusBadge,
  outcomeBadge,
} from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingState";
import Link from "next/link";

type PipelineStatus = RecoveryPipelineResponse["status"] | null;

const statusMeta: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; label: string; desc: string }
> = {
  ALREADY_PROCESSED: {
    icon: <RotateCcw size={20} />,
    color: "var(--gold)",
    bg: "var(--gold-dim)",
    label: "Already Processed",
    desc: "This revenue event has already been processed through the recovery pipeline.",
  },
  NO_RECOVERY_REQUIRED: {
    icon: <CheckCircle2 size={20} />,
    color: "var(--blue)",
    bg: "var(--blue-dim)",
    label: "No Recovery Required",
    desc: "The AI determined that no recovery action is needed for this event.",
  },
  POLICY_REJECTED: {
    icon: <AlertTriangle size={20} />,
    color: "var(--orange)",
    bg: "var(--orange-dim)",
    label: "Policy Rejected",
    desc: "The AI strategy was rejected by the merchant's policy engine.",
  },
  RECOVERY_SUCCEEDED: {
    icon: <CheckCircle2 size={20} />,
    color: "var(--green)",
    bg: "var(--green-dim)",
    label: "Recovery Succeeded",
    desc: "The recovery action was executed successfully and revenue has been attributed.",
  },
  RECOVERY_FAILED: {
    icon: <XCircle size={20} />,
    color: "var(--red)",
    bg: "var(--red-dim)",
    label: "Recovery Failed",
    desc: "The recovery action was executed but did not succeed.",
  },
};

export default function OrchestratorPage() {
  const [eventId, setEventId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RecoveryPipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const run = async () => {
    if (!eventId.trim()) return;
    setRunning(true);
    setResult(null);
    setError(null);
    setActiveStep(0);

    // Animate through pipeline steps
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 600);

    try {
      const data = await api.orchestrator.process(eventId.trim());
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline execution failed");
    } finally {
      clearInterval(stepInterval);
      setActiveStep(7);
      setRunning(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setActiveStep(0);
    setEventId("");
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const meta = result?.status ? statusMeta[result.status] : null;

  const pipelineSteps = [
    { label: "Fetch Event", icon: "⚡" },
    { label: "Create Case", icon: "📋" },
    { label: "AI Strategy", icon: "🧠" },
    { label: "Policy Check", icon: "🛡️" },
    { label: "Create Action", icon: "⚙️" },
    { label: "Execute", icon: "▶️" },
    { label: "Attribution", icon: "💰" },
  ];

  return (
    <>
      <div className="page-header">
        <Rocket size={18} color="var(--gold)" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Recovery Orchestrator
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Trigger the full end-to-end AI recovery pipeline for a revenue event
          </div>
        </div>
      </div>

      <div className="page-body fade-in">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* ─── Left: Input Panel ─────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Input card */}
            <div className="card">
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "var(--gold)" }}>⚡</span>
                Process Revenue Event
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                Paste a Revenue Event UUID to trigger the full AI recovery
                pipeline — from event detection through to revenue attribution.
              </div>

              <label className="form-label">Revenue Event ID</label>
              <input
                className="form-input"
                placeholder="e.g. 3d3919de-c7d9-4cf1-b0f2-c3bc2752f4fc"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !running && run()}
                disabled={running}
                style={{ marginBottom: 14, fontFamily: "var(--font-mono)" }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={run}
                  disabled={running || !eventId.trim()}
                  style={{ flex: 1 }}
                >
                  {running ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Running…
                    </>
                  ) : (
                    <>
                      <Rocket size={14} />
                      Run Pipeline
                    </>
                  )}
                </button>
                {(result || error) && (
                  <button className="btn btn-ghost" onClick={reset}>
                    <RotateCcw size={13} />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="card">
              <div
                style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}
              >
                Pipeline Stages
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {pipelineSteps.map((step, i) => {
                  const isDone = activeStep > i;
                  const isActive = running && activeStep === i;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px 0",
                        borderBottom:
                          i < pipelineSteps.length - 1
                            ? "1px solid var(--border-dim)"
                            : "none",
                        transition: "all 0.3s",
                      }}
                    >
                      {/* Step icon */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isDone
                            ? "var(--green-dim)"
                            : isActive
                            ? "var(--gold-dim)"
                            : "var(--bg-elevated)",
                          border: `1px solid ${
                            isDone
                              ? "var(--green)"
                              : isActive
                              ? "var(--gold)"
                              : "var(--border-dim)"
                          }`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          flexShrink: 0,
                          transition: "all 0.3s",
                        }}
                      >
                        {isDone ? (
                          <CheckCircle2 size={14} color="var(--green)" />
                        ) : isActive ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: isDone
                            ? "var(--green)"
                            : isActive
                            ? "var(--gold)"
                            : "var(--text-muted)",
                          fontWeight: isDone || isActive ? 500 : 400,
                          transition: "color 0.3s",
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Right: Results ───────────────────────────── */}
          <div>
            {!result && !error && !running && (
              <div
                className="card"
                style={{ textAlign: "center", padding: "80px 40px" }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  Ready to Process
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto" }}>
                  Enter a Revenue Event ID and click{" "}
                  <strong style={{ color: "var(--gold)" }}>Run Pipeline</strong>{" "}
                  to see the full AI recovery flow in action.
                </div>
              </div>
            )}

            {running && !result && (
              <div
                className="card"
                style={{ textAlign: "center", padding: "80px 40px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <LoadingSpinner size="lg" />
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  AI Pipeline Running…
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {pipelineSteps[Math.min(activeStep, pipelineSteps.length - 1)]?.label}
                </div>
              </div>
            )}

            {error && (
              <div
                className="card"
                style={{ borderColor: "var(--red)", textAlign: "center", padding: "40px" }}
              >
                <XCircle
                  size={32}
                  color="var(--red)"
                  style={{ margin: "0 auto 12px" }}
                />
                <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--red)" }}>
                  Pipeline Error
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {error}
                </div>
              </div>
            )}

            {result && meta && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Status banner */}
                <div
                  className="card"
                  style={{
                    borderColor: meta.color,
                    background: meta.bg,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ color: meta.color, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: meta.color,
                        marginBottom: 4,
                      }}
                    >
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {meta.desc}
                    </div>
                  </div>
                  <ArrowRight size={16} color={meta.color} style={{ flexShrink: 0, opacity: 0.6 }} />
                </div>

                {/* Pipeline output cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  {result.event && (
                    <ResultCard
                      icon="⚡"
                      title="Revenue Event"
                      color="var(--gold)"
                      rows={[
                        { label: "Type", value: result.event.eventType.replace(/_/g, " ") },
                        { label: "Processed", value: result.event.processedAt ? "Yes" : "No" },
                        { label: "Occurred", value: result.event.occurredAt ? new Date(result.event.occurredAt).toLocaleDateString() : "—" },
                      ]}
                    />
                  )}

                  {result.recoveryCase && (
                    <ResultCard
                      icon="📋"
                      title="Recovery Case"
                      color="var(--blue)"
                      link={`/recovery-cases/${result.recoveryCase.id}`}
                      rows={[
                        { label: "Type", value: result.recoveryCase.caseType.replace(/_/g, " ") },
                        { label: "Status", value: result.recoveryCase.status.replace("_", " "), badge: `badge ${caseStatusBadge(result.recoveryCase.status)}` },
                        { label: "Priority", value: result.recoveryCase.priority },
                        ...(result.recoveryCase.estimatedRecovery
                          ? [{ label: "Est. Recovery", value: formatCurrency(result.recoveryCase.estimatedRecovery, result.recoveryCase.currency) }]
                          : []),
                      ]}
                    />
                  )}

                  {(result.strategyDecision || result.validatedDecision) && (
                    <ResultCard
                      icon="🧠"
                      title="AI Strategy"
                      color="var(--purple)"
                      rows={[
                        { label: "Decision", value: formatDecision((result.validatedDecision || result.strategyDecision)!.decision) },
                        { label: "Status", value: (result.validatedDecision || result.strategyDecision)!.status, badge: `badge ${decisionBadge((result.validatedDecision || result.strategyDecision)!.status)}` },
                        { label: "Confidence", value: confidencePct((result.validatedDecision || result.strategyDecision)!.confidence) },
                        { label: "Risk", value: (result.validatedDecision || result.strategyDecision)!.riskLevel },
                        { label: "Model", value: (result.validatedDecision || result.strategyDecision)!.model, mono: true },
                      ]}
                    />
                  )}

                  {result.recoveryAction && (
                    <ResultCard
                      icon="⚙️"
                      title="Recovery Action"
                      color="var(--blue)"
                      rows={[
                        { label: "Type", value: result.recoveryAction.actionType.replace(/_/g, " ") },
                        { label: "Status", value: result.recoveryAction.status, badge: `badge ${actionStatusBadge(result.recoveryAction.status)}` },
                        ...(result.recoveryAction.errorMessage
                          ? [{ label: "Error", value: result.recoveryAction.errorMessage }]
                          : []),
                      ]}
                    />
                  )}

                  {result.outcome && (
                    <ResultCard
                      icon="📊"
                      title="Outcome"
                      color="var(--green)"
                      rows={[
                        { label: "Status", value: result.outcome.status.replace("_", " "), badge: `badge ${outcomeBadge(result.outcome.status)}` },
                        ...(result.outcome.recoveredAmount
                          ? [{ label: "Recovered", value: formatCurrency(result.outcome.recoveredAmount, result.outcome.currency) }]
                          : []),
                        ...(result.outcome.failureReason
                          ? [{ label: "Reason", value: result.outcome.failureReason }]
                          : []),
                      ]}
                    />
                  )}

                  {result.attribution && (
                    <ResultCard
                      icon="💰"
                      title="Revenue Attribution"
                      color="var(--gold)"
                      rows={[
                        { label: "Amount", value: formatCurrency(result.attribution.amount, result.attribution.currency) },
                        { label: "Type", value: result.attribution.attributionType },
                        { label: "Attributed", value: formatDateTime(result.attribution.attributedAt) },
                      ]}
                    />
                  )}
                </div>

                {/* Raw JSON */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border-dim)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      Raw Pipeline Response
                    </span>
                    <button className="btn btn-ghost" onClick={copyResult} style={{ padding: "4px 10px" }}>
                      {copied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="code-block" style={{ margin: 0, borderRadius: 0, maxHeight: 320, border: "none" }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ResultCard({
  icon,
  title,
  color,
  rows,
  link,
}: {
  icon: string;
  title: string;
  color: string;
  rows: { label: string; value: string; mono?: boolean; badge?: string }[];
  link?: string;
}) {
  return (
    <div
      className="card-sm"
      style={{ borderColor: `${color}40`, background: `${color}08` }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>
            {title}
          </span>
        </div>
        {link && (
          <Link
            href={link}
            style={{
              fontSize: 11,
              color,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            View <ArrowRight size={10} />
          </Link>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
              {row.label}
            </span>
            {row.badge ? (
              <span className={row.badge} style={{ fontSize: 10 }}>
                {row.value}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: row.mono ? "var(--font-mono)" : undefined,
                  color: "var(--text-secondary)",
                  textAlign: "right",
                }}
              >
                {row.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
