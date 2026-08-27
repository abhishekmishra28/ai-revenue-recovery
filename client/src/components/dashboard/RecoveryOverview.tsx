"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Target,
  TrendingUp,
} from "lucide-react";

type RecoveryOverviewProps = {
  totalOpportunity: number;
  recoveredAmount: number;
  failedAmount: number;
  openOpportunity: number;
  recoveryRate: number;
  currency?: string;
};

function formatCurrency(
  value: number,
  currency: string,
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function percentage(
  value: number,
  total: number,
) {
  if (total <= 0) {
    return 0;
  }

  return Math.min((value / total) * 100, 100);
}

export default function RecoveryOverview({
  totalOpportunity,
  recoveredAmount,
  failedAmount,
  openOpportunity,
  recoveryRate,
  currency = "INR",
}: RecoveryOverviewProps) {
  const recoveredPercentage = percentage(
    recoveredAmount,
    totalOpportunity,
  );

  const failedPercentage = percentage(
    failedAmount,
    totalOpportunity,
  );

  const openPercentage = percentage(
    openOpportunity,
    totalOpportunity,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-slate-700" />

            <h2 className="text-base font-semibold text-slate-900">
              Recovery Overview
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Track recovered revenue against the total recovery
            opportunity.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />

          <span className="text-sm font-semibold text-slate-700">
            {recoveryRate.toFixed(1)}%
          </span>

          <span className="text-xs text-slate-500">
            recovery rate
          </span>
        </div>
      </div>

      {/* Main amount */}
      <div className="p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CircleDollarSign className="h-4 w-4" />

              Total Opportunity
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(
                totalOpportunity,
                currency,
              )}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Total revenue identified for recovery.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <ArrowUpRight className="h-4 w-4" />

              Successfully Recovered
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-700">
              {formatCurrency(
                recoveredAmount,
                currency,
              )}
            </p>

            <p className="mt-2 text-xs text-emerald-700/70">
              Revenue recovered through automated actions.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Recovery progress
            </span>

            <span className="text-sm font-semibold text-slate-900">
              {recoveredPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${recoveredPercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <BreakdownItem
            label="Recovered"
            amount={recoveredAmount}
            percentage={recoveredPercentage}
            currency={currency}
            icon={
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            }
            amountClassName="text-emerald-700"
            />

          <BreakdownItem
            label="Open Opportunity"
            amount={openOpportunity}
            percentage={openPercentage}
            currency={currency}
            icon={
                <Target className="h-4 w-4 text-amber-600" />
            }
            amountClassName="text-amber-700"
            />

          <BreakdownItem
            label="Open Opportunity"
            amount={openOpportunity}
            percentage={openPercentage}
            currency={currency}
            icon={
                <Target className="h-4 w-4 text-amber-600" />
            }
            amountClassName="text-amber-700"
            />
        </div>
      </div>
    </section>
  );
}

type BreakdownItemProps = {
  label: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
  amountClassName: string;
  currency: string;
};

function BreakdownItem({
  label,
  amount,
  percentage,
  icon,
  amountClassName,
  currency,
}: BreakdownItemProps) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}

          <span className="text-xs font-medium text-slate-500">
            {label}
          </span>
        </div>

        <span className="text-xs font-medium text-slate-400">
          {percentage.toFixed(1)}%
        </span>
      </div>

      <p
        className={`mt-2 text-lg font-semibold ${amountClassName}`}
      >
        {amount.toLocaleString("en-IN", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        })}
      </p>
    </div>
  );
}