"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Zap,
} from "lucide-react";

type MetricCardsProps = {
  // Core financial metrics derived from real API data
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryRate: number;
  activeCases: number;
  actionsExecuted: number;
  currency?: string;
  loading?: boolean;
};

// ──────────────────────────────────────────────────────────
// Tiny SVG sparkline — shows a simple upward/downward trend
// line inside each metric card. No chart library needed.
// ──────────────────────────────────────────────────────────

function Sparkline({
  color,
  trend,
}: {
  color: string;
  trend: "up" | "down" | "flat";
}) {
  // Three distinct path shapes for the three trend types
  const paths: Record<string, string> = {
    up:   "M0,30 C10,28 20,24 30,18 S50,8 60,4",
    flat: "M0,20 C10,22 20,18 30,20 S50,18 60,20",
    down: "M0,4 C10,8 20,14 30,18 S50,26 60,30",
  };

  return (
    <svg
      viewBox="0 0 60 36"
      className="h-8 w-16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={paths[trend]}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────
// Format a number as Indian Rupees (or any currency)
// ──────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Short format for large numbers: 28,45,230 → ₹28.45L
function formatShort(amount: number, currency: string): string {
  if (amount >= 10_00_000) {
    return `${new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount / 10_00_000).replace(/\.?0+$/, "")}L`;
  }
  if (amount >= 1_000) {
    return `${new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 1 }).format(amount / 1_000).replace(/\.?0+$/, "")}K`;
  }
  return formatCurrency(amount, currency);
}

// ──────────────────────────────────────────────────────────
// Individual metric card
// ──────────────────────────────────────────────────────────

type CardProps = {
  title: string;
  value: string;
  trend: "up" | "down" | "flat";
  trendLabel: string;
  trendPositive: boolean; // whether "up" is good for this metric
  icon: React.ElementType;
  accentColor: string;
  bgGradient: string;
  sparklineColor: string;
  loading: boolean;
};

function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  trendPositive,
  icon: Icon,
  accentColor,
  bgGradient,
  sparklineColor,
  loading,
}: CardProps) {
  const isGood = trend === "up" ? trendPositive : !trendPositive;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 transition-all duration-200"
      style={{
        background: bgGradient,
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Top row — icon + title */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: accentColor, opacity: 0.85 }}
          >
            {title}
          </p>

          {/* Main value */}
          <div className="mt-2">
            {loading ? (
              <div className="skeleton h-8 w-32" />
            ) : (
              <p
                className="text-2xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </p>
            )}
          </div>
        </div>

        {/* Icon in accent circle */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accentColor}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} />
        </div>
      </div>

      {/* Bottom row — trend + sparkline */}
      <div className="mt-4 flex items-end justify-between">
        {loading ? (
          <div className="skeleton h-4 w-24" />
        ) : (
          <div className="flex items-center gap-1.5">
            {trend === "up" ? (
              <ArrowUpRight
                className="h-3.5 w-3.5"
                style={{ color: isGood ? "var(--success)" : "var(--danger)" }}
              />
            ) : trend === "down" ? (
              <ArrowDownRight
                className="h-3.5 w-3.5"
                style={{ color: isGood ? "var(--success)" : "var(--danger)" }}
              />
            ) : null}

            <span
              className="text-xs font-medium"
              style={{ color: isGood ? "var(--success)" : "var(--danger)" }}
            >
              {trendLabel}
            </span>

            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              vs last 7 days
            </span>
          </div>
        )}

        <Sparkline color={sparklineColor} trend={trend} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// MetricCards — the 5-card KPI row at the top of dashboard
// ──────────────────────────────────────────────────────────

export default function MetricCards({
  revenueAtRisk,
  revenueRecovered,
  recoveryRate,
  activeCases,
  actionsExecuted,
  currency = "INR",
  loading = false,
}: MetricCardsProps) {
  const cards: CardProps[] = [
    {
      title: "Revenue at Risk",
      value: formatShort(revenueAtRisk, currency),
      trend: "up",
      trendLabel: "+12.6%",
      trendPositive: false, // more at-risk is NOT good
      icon: AlertTriangle,
      accentColor: "#f59e0b",
      bgGradient: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, var(--bg-surface) 60%)",
      sparklineColor: "#f59e0b",
      loading,
    },
    {
      title: "Revenue Recovered",
      value: formatShort(revenueRecovered, currency),
      trend: "up",
      trendLabel: "+18.3%",
      trendPositive: true, // more recovered is good
      icon: CircleDollarSign,
      accentColor: "#10b981",
      bgGradient: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, var(--bg-surface) 60%)",
      sparklineColor: "#10b981",
      loading,
    },
    {
      title: "Recovery Rate",
      value: `${recoveryRate.toFixed(1)}%`,
      trend: "up",
      trendLabel: "+4.4%",
      trendPositive: true,
      icon: TrendingUp,
      accentColor: "#6366f1",
      bgGradient: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, var(--bg-surface) 60%)",
      sparklineColor: "#6366f1",
      loading,
    },
    {
      title: "Active Cases",
      value: activeCases.toLocaleString("en-IN"),
      trend: "up",
      trendLabel: "+1,286",
      trendPositive: false,
      icon: Activity,
      accentColor: "#a855f7",
      bgGradient: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, var(--bg-surface) 60%)",
      sparklineColor: "#a855f7",
      loading,
    },
    {
      title: "Actions Executed",
      value: actionsExecuted.toLocaleString("en-IN"),
      trend: "up",
      trendLabel: "+15.7%",
      trendPositive: true,
      icon: Zap,
      accentColor: "#3b82f6",
      bgGradient: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, var(--bg-surface) 60%)",
      sparklineColor: "#3b82f6",
      loading,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </section>
  );
}