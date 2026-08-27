"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

type Props = {
  children: React.ReactNode;
  // The page title shown in the top bar (e.g. "Overview")
  pageTitle: string;
  // Optional subtitle shown beneath the page title
  pageSubtitle?: string;
};

/**
 * AppShell
 *
 * The master layout used by every authenticated page.
 * Renders the dark sidebar on the left, the top bar across
 * the top, and wraps the page content in the scrollable
 * main area.
 *
 * Sidebar is collapsible on mobile — the toggle state lives
 * here so both Sidebar and TopBar can share it.
 */
export default function AppShell({
  children,
  pageTitle,
  pageSubtitle,
}: Props) {
  // Whether the mobile sidebar is open. On desktop the sidebar
  // is always visible so this only affects small screens.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay — click to close sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
