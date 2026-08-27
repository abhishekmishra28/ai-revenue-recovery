"use client";

import { BrainCircuit, ShieldCheck, Target, Zap } from "lucide-react";
import type { AuditEvent, RecoveryCase } from "@/types/recovery";
import { useMemo } from "react";

type Props = {
  recoveryCases: RecoveryCase[];
  auditEvents: AuditEvent[];
};

/**
 * AIInsights
 *
 * Shows the aggregate impact of AI on the recovery process:
 * how many decisions were made, confidence averages, and
 * validation success rates.
 */
export default function AIInsights({ recoveryCases, auditEvents }: Props) {
  // Aggregate stats
  const stats = useMemo(() => {
    // 1. Total decisions generated
    const decisions = auditEvents.filter(
      (e) => e.eventType === "AI_STRATEGY_GENERATED"
    );
    const totalDecisions = decisions.length;

    // 2. Average confidence
    let totalConfidence = 0;
    for (const d of decisions) {
      const conf = Number(d.metadata?.confidence);
      if (!isNaN(conf)) {
        totalConfidence += conf;
      }
    }
    const avgConfidence =
      totalDecisions > 0 ? totalConfidence / totalDecisions : 0;

    // 3. Validation rate
    const validations = auditEvents.filter(
      (e) => e.eventType === "AI_STRATEGY_VALIDATED"
    );
    const rejections = auditEvents.filter(
      (e) => e.eventType === "AI_STRATEGY_REJECTED"
    );
    const totalEvaluated = validations.length + rejections.length;
    const validationRate =
      totalEvaluated > 0 ? (validations.length / totalEvaluated) * 100 : 0;

    return {
      totalDecisions,
      avgConfidence,
      validationRate,
    };
  }, [auditEvents]);

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 p-5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(168,85,247,0.15)" }}
        >
          <BrainCircuit className="h-5 w-5" style={{ color: "#a855f7" }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            AI Engine Performance
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Gemini-3.6-flash decision metrics
          </p>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-6">
        
        {/* Metric 1: Total Decisions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--bg-elevated)" }}>
              <Zap className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Strategies Generated</p>
            </div>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {stats.totalDecisions.toLocaleString()}
          </p>
        </div>

        {/* Metric 2: Avg Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--bg-elevated)" }}>
              <Target className="h-4 w-4" style={{ color: "var(--success)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Average Confidence</p>
            </div>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--success)" }}>
            {(stats.avgConfidence * 100).toFixed(1)}%
          </p>
        </div>

        {/* Metric 3: Validation Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--bg-elevated)" }}>
              <ShieldCheck className="h-4 w-4" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Policy Validation Rate</p>
            </div>
          </div>
          <p className="text-lg font-bold" style={{ color: "#3b82f6" }}>
            {stats.validationRate.toFixed(1)}%
          </p>
        </div>

      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div
        className="p-4"
        style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-subtle)", borderBottomLeftRadius: "0.75rem", borderBottomRightRadius: "0.75rem" }}
      >
        <p className="text-[11px] leading-relaxed text-center" style={{ color: "var(--text-muted)" }}>
          The AI engine analyzes case context and recommends strategies. Every decision is strictly validated against deterministic policies before execution.
        </p>
      </div>
    </div>
  );
}
