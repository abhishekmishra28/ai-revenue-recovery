"use client";

import {
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Zap,
} from "lucide-react";

type RecoveryOverviewProps = {
  totalCases: number;
  openCases: number;
  recoveredCases: number;
  failedCases: number;
  recoveredRevenue: number;
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

function StatSkeleton() {
  return (
    <div className="h-6 w-20 animate-pulse rounded bg-slate-200" />
  );
}

export default function RecoveryOverview({
  totalCases,
  openCases,
  recoveredCases,
  failedCases,
  recoveredRevenue,
  currency = "INR",
  loading = false,
}: RecoveryOverviewProps) {
  const recoveryRate =
    totalCases > 0
      ? (recoveredCases / totalCases) * 100
      : 0;

  const stats = [
    {
      label: "AI Decisions",
      value: totalCases,
      icon: BrainCircuit,
      description: "Recovery cases evaluated",
    },
    {
      label: "Active Recovery",
      value: openCases,
      icon: Clock3,
      description: "Cases still being processed",
    },
    {
      label: "Successful",
      value: recoveredCases,
      icon: CheckCircle2,
      description: "Cases successfully recovered",
    },
    {
      label: "Failed",
      value: failedCases,
      icon: ShieldCheck,
      description: "Cases requiring attention",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-slate-700" />

              <h2 className="text-lg font-semibold text-slate-900">
                Recovery Overview
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Real-time performance of the AI recovery pipeline.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Recovery Rate
            </p>

            {loading ? (
              <div className="mt-1">
                <StatSkeleton />
              </div>
            ) : (
              <p className="mt-1 text-xl font-bold text-slate-900">
                {recoveryRate.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-4 w-4 text-slate-700" />
                </div>

                {!loading && (
                  <span className="text-xs font-medium text-slate-400">
                    Cases
                  </span>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                {loading ? (
                  <div className="mt-2">
                    <StatSkeleton />
                  </div>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stat.value.toLocaleString("en-IN")}
                  </p>
                )}

                <p className="mt-1 text-xs text-slate-500">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
              <CircleDollarSign className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Recovered Revenue
              </p>

              {loading ? (
                <div className="mt-1">
                  <StatSkeleton />
                </div>
              ) : (
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(
                    recoveredRevenue,
                    currency,
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-right text-xs leading-5 text-slate-500">
              Revenue attributed to successful recovery
              actions across the recovery pipeline.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}