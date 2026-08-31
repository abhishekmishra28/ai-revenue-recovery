"use client";

import AppShell from "@/components/layout/AppShell";
import { Wrench } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <AppShell
      pageTitle="Coming Soon"
      pageSubtitle="This section is under construction."
    >
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Wrench
            className="h-8 w-8"
            style={{ color: "var(--text-muted)" }}
          />
        </div>

        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Section Under Construction
        </h1>

        <p
          className="mt-2 max-w-sm text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          This page is a placeholder for the hackathon demo. Navigate back to
          the Overview page to see the live AI Revenue Recovery dashboard in
          action!
        </p>
      </div>
    </AppShell>
  );
}