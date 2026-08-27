"use client";

import type { RecoveryCase } from "@/types/recovery";

type DashboardStatsProps = {
  cases: RecoveryCase[];
};

const formatAmount = (
  amount: string | number | null | undefined,
  currency = "INR",
) => {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function DashboardStats({
  cases,
}: DashboardStatsProps) {
  const totalCases = cases.length;

  const openCases = cases.filter(
    (item) => item.status === "OPEN",
  ).length;

  const inProgressCases = cases.filter(
    (item) => item.status === "IN_PROGRESS",
  ).length;

  const recoveredCases = cases.filter(
    (item) => item.status === "RECOVERED",
  ).length;

  const estimatedRecovery = cases.reduce(
    (total, item) =>
      total + Number(item.estimatedRecovery ?? 0),
    0,
  );

  const recoveryRate =
    totalCases > 0
      ? Math.round((recoveredCases / totalCases) * 100)
      : 0;

  const stats = [
    {
      label: "Total Recovery Cases",
      value: totalCases.toString(),
      description: "All recovery cases",
    },
    {
      label: "Open Cases",
      value: openCases.toString(),
      description: "Awaiting recovery action",
    },
    {
      label: "In Progress",
      value: inProgressCases.toString(),
      description: "Currently being processed",
    },
    {
      label: "Recovered",
      value: recoveredCases.toString(),
      description: `${recoveryRate}% recovery rate`,
    },
    {
      label: "Estimated Recovery",
      value: formatAmount(estimatedRecovery),
      description: "Potential revenue recovery",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">
            {stat.label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {stat.value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {stat.description}
          </p>
        </div>
      ))}
    </section>
  );
}