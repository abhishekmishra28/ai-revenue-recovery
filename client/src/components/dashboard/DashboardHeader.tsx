"use client";

import { RefreshCw } from "lucide-react";

type DashboardHeaderProps = {
  onRefresh?: () => void;
  refreshing?: boolean;
};

export default function DashboardHeader({
  onRefresh,
  refreshing = false,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Revenue Recovery
          </h1>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Monitor failed payments, AI decisions, and recovered revenue.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
        />

        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}
