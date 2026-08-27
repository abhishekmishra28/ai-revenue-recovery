"use client";

import { Bell, Download, Filter, HelpCircle, Menu } from "lucide-react";

type Props = {
  pageTitle: string;
  pageSubtitle?: string;
  onMenuToggle: () => void;
};

/**
 * TopBar
 *
 * The horizontal bar at the top of every dashboard page.
 * Shows a contextual greeting, date range picker, action
 * buttons, and the merchant avatar.
 *
 * Kept intentionally simple — the page title and greeting
 * are passed as props from each page.
 */
export default function TopBar({ pageTitle, pageSubtitle, onMenuToggle }: Props) {
  // Get a time-appropriate greeting
  const greeting = getGreeting();

  return (
    <header
      className="flex shrink-0 items-center justify-between px-6 py-3.5"
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-subtle)",
        minHeight: "64px",
      }}
    >
      {/* ── Left side — greeting & page title ──────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden rounded-lg p-1.5 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {greeting} — {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Right side — actions & avatar ──────────────── */}
      <div className="flex items-center gap-2">
        {/* Date range — cosmetic for now, would be wired to filters */}
        <div
          className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium md:flex"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          <span>May 12 – May 18, 2025</span>
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 10.5l-4-4h8l-4 4z" />
          </svg>
        </div>

        {/* Filters button */}
        <button
          className="btn-ghost hidden items-center gap-1.5 md:flex"
          style={{ padding: "6px 12px", fontSize: "12px" }}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>

        {/* Export Report button */}
        <button
          className="btn-primary hidden items-center gap-1.5 md:flex"
          style={{ padding: "6px 12px", fontSize: "12px" }}
        >
          <Download className="h-3.5 w-3.5" />
          Export Report
        </button>

        {/* Notification bell */}
        <button
          className="relative rounded-lg p-2 transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {/* Unread dot */}
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: "var(--accent-primary)" }}
          />
        </button>

        {/* Help */}
        <button
          className="rounded-lg p-2 transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Help"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>

        {/* Merchant avatar */}
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#fff",
            }}
          >
            A
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              Acme Corp
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Merchant
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// Returns "Good morning", "Good afternoon", or "Good evening"
// based on the current local time.
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
