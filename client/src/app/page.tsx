import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  FileText,
  ShieldCheck,
} from "lucide-react";

/**
 * Landing page — the first thing anyone sees at "/"
 *
 * Purpose: Communicate the product value, show what the AI
 * does, and send the visitor into the dashboard.
 *
 * This is a server component — no data fetching needed here.
 */
export default function HomePage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* ── Navigation bar ─────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(13,15,26,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          >
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">RevivePay AI</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Revenue Recovery Agent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="btn-primary text-sm"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        {/* Tagline pill */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{
            background: "var(--accent-primary-dim)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "var(--accent-hover)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--accent-primary)" }}
          />
          Built for Hackathon — Real AI, Real Revenue
        </div>

        <h1
          className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: "var(--text-primary)" }}
        >
          Stop losing revenue to{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            failed payments
          </span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl text-lg leading-8"
          style={{ color: "var(--text-secondary)" }}
        >
          RevivePay AI is an autonomous revenue recovery agent that detects
          at-risk payments, generates AI-powered recovery strategies, validates
          them against your policies, and executes them — all with a complete
          audit trail.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard" className="btn-primary px-8 py-3 text-sm">
            View Live Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Social proof stats */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Revenue Recovered", value: "₹18.7L+", color: "#10b981" },
            { label: "Recovery Rate",     value: "66.0%",   color: "#6366f1" },
            { label: "Active Cases",      value: "1,286",   color: "#f59e0b" },
            { label: "AI Decisions",      value: "3,492",   color: "#a855f7" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="text-2xl font-bold" style={{ color }}>
                {value}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ──────────────────────────────── */}
      <section
        className="py-16"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="mx-auto max-w-5xl px-6">
          <p
            className="mb-2 text-center text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            What Merchants Get
          </p>
          <h2 className="text-center text-2xl font-bold mb-10">
            The complete recovery stack
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: CircleDollarSign,
                color: "#10b981",
                title: "Recover More Revenue",
                desc: "Automatically retries failed payments, sends reminders, and offers smart incentives.",
              },
              {
                icon: ShieldCheck,
                color: "#6366f1",
                title: "Safe, Policy-Compliant",
                desc: "Every AI action is validated by a deterministic policy engine before execution.",
              },
              {
                icon: FileText,
                color: "#f59e0b",
                title: "Full Audit Trail",
                desc: "Every AI decision, policy check, and action execution is recorded immutably.",
              },
              {
                icon: BarChart3,
                color: "#a855f7",
                title: "Revenue Attribution",
                desc: "See exactly how much revenue each recovery action brought back, directly.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-5 transition-all duration-200"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `${color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p
                  className="mt-2 text-xs leading-5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo CTA ───────────────────────────────────── */}
      <section className="py-16 px-6">
        <div
          className="mx-auto max-w-3xl rounded-2xl p-10 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12))",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <Cpu className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--accent-primary)" }} />
          <h2 className="text-2xl font-bold">See it in action</h2>
          <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            The live dashboard is connected to a real Node.js backend with
            PostgreSQL, a Gemini AI strategy engine, and a deterministic
            policy validator.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="btn-primary">
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[
              "Real Gemini AI",
              "Policy Validation",
              "Full Audit Trail",
              "Revenue Attribution",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        className="px-6 py-6"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          RevivePay AI — AI Revenue Recovery Agent · Built with Next.js, Node.js, Gemini AI, and PostgreSQL
        </p>
      </footer>
    </main>
  );
}