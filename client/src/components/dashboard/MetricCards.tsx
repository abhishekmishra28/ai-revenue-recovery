"use client";

import {
  Activity,
  AlertTriangle,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";

type MetricCardsProps = {
  totalCases: number;
  recoveredRevenue: number;
  recoveryRate: number;
  activeCases: number;
  currency?: string;
  loading?: boolean;
};

const formatCurrency = (
  value: number,
  currency: string,
) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

function MetricSkeleton() {
  return (
    <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
  );
}

export default function MetricCards({
  totalCases,
  recoveredRevenue,
  recoveryRate,
  activeCases,
  currency = "INR",
  loading = false,
}: MetricCardsProps) {
  const metrics = [
    {
      title: "Total Recovery Cases",
      value: totalCases.toLocaleString("en-IN"),
      description: "Cases processed by the recovery engine",
      icon: Activity,
    },
    {
      title: "Recovered Revenue",
      value: formatCurrency(
        recoveredRevenue,
        currency,
      ),
      description: "Revenue successfully recovered",
      icon: CircleDollarSign,
    },
    {
      title: "Recovery Rate",
      value: `${recoveryRate.toFixed(1)}%`,
      description: "Cases resulting in successful recovery",
      icon: TrendingUp,
    },
    {
      title: "Active Cases",
      value: activeCases.toLocaleString("en-IN"),
      description: "Cases currently requiring recovery",
      icon: AlertTriangle,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div
            key={metric.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {metric.title}
                </p>

                <div className="mt-3">
                  {loading ? (
                    <MetricSkeleton />
                  ) : (
                    <p className="text-2xl font-bold tracking-tight text-slate-900">
                      {metric.value}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Icon className="h-5 w-5 text-slate-700" />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {metric.description}
            </p>
          </div>
        );
      })}
    </section>
  );
}