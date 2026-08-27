"use client";

import { RefreshCw, Bell, Settings } from "lucide-react";

type DashboardHeaderProps = {
  onRefresh?: () => void;
  refreshing?: boolean;
};

export default function DashboardHeader({
  onRefresh,
  refreshing = false,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            RR
          </div>

          <span className="text-sm font-semibold tracking-wide text-slate-500">
            REVENUE RECOVERY
          </span>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Recovery Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor AI-powered payment recovery and recovered revenue.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <Bell className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}