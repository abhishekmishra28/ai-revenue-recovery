"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CircleDollarSign,
  FileSearch,
  Play,
  ShieldCheck,
  Zap,
} from "lucide-react";

// Each step in the closed-loop recovery pipeline
const STEPS = [
  {
    number: 1,
    title: "Event Ingestion",
    description:
      "Payment, checkout and subscription events are ingested in real-time.",
    icon: Activity,
    color: "#6366f1",
  },
  {
    number: 2,
    title: "Detect At-Risk Revenue",
    description:
      "The system identifies events with potential revenue at risk.",
    icon: FileSearch,
    color: "#f59e0b",
  },
  {
    number: 3,
    title: "AI Diagnosis",
    description:
      "AI analyses context and finds the likely reason for failure or drop-off.",
    icon: BrainCircuit,
    color: "#a855f7",
  },
  {
    number: 4,
    title: "AI Strategy Selection",
    description:
      "AI chooses the best recovery strategy or decides no action.",
    icon: Zap,
    color: "#3b82f6",
  },
  {
    number: 5,
    title: "Policy & Safety Check",
    description:
      "Validator + Policy engine ensures the action is safe, legal and within limits.",
    icon: ShieldCheck,
    color: "#10b981",
  },
  {
    number: 6,
    title: "Execute Action",
    description:
      "Approved actions are executed via deterministic tools and connectors.",
    icon: Play,
    color: "#10b981",
  },
  {
    number: 7,
    title: "Observe Outcome",
    description:
      "The system observes the result and tracks payment outcomes.",
    icon: BarChart3,
    color: "#3b82f6",
  },
  {
    number: 8,
    title: "Measure & Audit",
    description:
      "Recovery is measured end-to-end, and everything is audited for trust.",
    icon: CircleDollarSign,
    color: "#10b981",
  },
];

/**
 * HowItWorksSection
 *
 * An 8-step horizontal flow diagram that explains the
 * AI Revenue Recovery pipeline to merchants and interviewers.
 * Matches the "How It Works" section from the screenshot.
 */
export default function HowItWorksSection() {
  return (
    <section
      className="rounded-xl p-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* ── Section header ────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-1.5 w-6 rounded-full"
            style={{ background: "var(--accent-primary)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>
            How It Works
          </p>
        </div>

        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          The AI Revenue Recovery closed loop
        </h2>

        <p className="mt-1 text-sm leading-6 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          The AI Revenue Recovery Agent runs a closed-loop system to detect,
          decide, act, and measure revenue recovery — autonomously but always
          within merchant-defined policies.
        </p>
      </div>

      {/* ── Steps grid ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Step card */}
              <div
                className="relative flex flex-col items-center w-full"
              >
                {/* Circle icon */}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: `${step.color}15`,
                    border: `2px solid ${step.color}40`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: step.color }} />
                </div>

                {/* Step number */}
                <div
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: step.color,
                    color: "#fff",
                  }}
                >
                  {step.number}
                </div>

                {/* Arrow between steps */}
                {!isLast && (
                  <div
                    className="absolute top-6 -right-2 hidden lg:block"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              {/* Label */}
              <p
                className="mt-3 text-[11px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {step.title}
              </p>

              {/* Description */}
              <p
                className="mt-1 text-[10px] leading-4"
                style={{ color: "var(--text-muted)" }}
              >
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Bottom insight ────────────────────────────── */}
      <div
        className="mt-6 rounded-lg px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>AI always recommends.</strong>{" "}
            Policy engine always validates.{" "}
            <strong style={{ color: "var(--text-primary)" }}>Execution engine always executes.</strong>{" "}
            Three distinct, auditable layers.
          </p>
        </div>
      </div>
    </section>
  );
}
