"use client";

import type { RecoveryCase } from "@/types/recovery";

type Props = {
  recoveryCases: RecoveryCase[];
  currency?: string;
  loading?: boolean;
};

type Segment = {
  label: string;
  caseType: string;
  color: string;
  count: number;
  amount: number;
  percentage: number;
};

/**
 * RecoveryByWorkflow
 *
 * Shows recovered revenue broken down by workflow type
 * (Failed Payments, Checkout Abandonment, Subscription Failures)
 * as a pure SVG donut chart with a legend below.
 *
 * No external chart library — just math and SVG paths.
 */
export default function RecoveryByWorkflow({
  recoveryCases,
  currency = "INR",
  loading = false,
}: Props) {
  // ── Build segments from real data ────────────────────

  const workflowDefs = [
    {
      label: "Failed Payments",
      caseType: "FAILED_PAYMENT",
      color: "#6366f1",
    },
    {
      label: "Checkout Abandonment",
      caseType: "CHECKOUT_ABANDONMENT",
      color: "#a855f7",
    },
    {
      label: "Failed Subscriptions",
      caseType: "SUBSCRIPTION_FAILURE",
      color: "#3b82f6",
    },
  ];

  const totals = workflowDefs.map((def) => {
    const filtered = recoveryCases.filter(
      (c) => c.caseType === def.caseType
    );
    const amount = filtered.reduce(
      (sum, c) => sum + Number(c.estimatedRecovery ?? 0),
      0
    );
    return { ...def, count: filtered.length, amount };
  });

  const grandTotal = totals.reduce((s, t) => s + t.amount, 0);

  const segments: Segment[] = totals.map((t) => ({
    ...t,
    percentage: grandTotal > 0 ? (t.amount / grandTotal) * 100 : 0,
  }));

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(grandTotal);

  // ── SVG donut math ───────────────────────────────────

  // Build SVG arc paths for a donut chart.
  // Circle: cx=50, cy=50, r=40. Total circumference = 2πr ≈ 251.
  const cx = 50;
  const cy = 50;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const gap = 2; // gap between segments in SVG units

  let cumulativePercent = 0;
  const arcs = segments.map((seg) => {
    const startPercent = cumulativePercent;
    cumulativePercent += seg.percentage;

    const dashArray = (seg.percentage / 100) * circumference - gap;
    const dashOffset = circumference - (startPercent / 100) * circumference;

    return { ...seg, dashArray: Math.max(dashArray, 0), dashOffset };
  });

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Recovery by Workflow
      </p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
        Estimated recovery by case type
      </p>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="skeleton mx-auto h-32 w-32 rounded-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
        </div>
      ) : (
        <>
          {/* ── Donut Chart ──────────────────────────── */}
          <div className="my-4 flex items-center justify-center">
            <div className="relative">
              <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
                {/* Track (background ring) */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="var(--bg-elevated)"
                  strokeWidth="14"
                />

                {/* Colored segments */}
                {arcs.map((arc) => (
                  <circle
                    key={arc.label}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="14"
                    strokeDasharray={`${arc.dashArray} ${circumference}`}
                    strokeDashoffset={arc.dashOffset}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.5s ease" }}
                  />
                ))}
              </svg>

              {/* Center label */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                <p
                  className="text-base font-bold leading-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formattedTotal}
                </p>
                <p
                  className="mt-1 text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Recovered
                </p>
              </div>
            </div>
          </div>

          {/* ── Legend ───────────────────────────────── */}
          <div className="space-y-2.5">
            {segments.map((seg) => {
              const formatted = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              }).format(seg.amount);

              return (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: seg.color }}
                    />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {seg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatted}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: `${seg.color}20`,
                        color: seg.color,
                      }}
                    >
                      {seg.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
