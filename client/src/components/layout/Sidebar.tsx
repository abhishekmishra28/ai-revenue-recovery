"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

// ──────────────────────────────────────────────────────────
// Navigation structure — mirrors the screenshot exactly
// ──────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "At Risk",
    href: "/dashboard/at-risk",
    icon: AlertTriangle,
  },
  {
    label: "Recoveries",
    href: "/dashboard/recoveries",
    icon: RefreshCcw,
  },
  {
    label: "Workflows",
    icon: Activity,
    children: [
      { label: "Failed Payments", href: "/dashboard/workflows/failed-payments" },
      { label: "Checkout Abandonment", href: "/dashboard/workflows/checkout-abandonment" },
      { label: "Failed Subscriptions", href: "/dashboard/workflows/failed-subscriptions" },
    ],
  },
  {
    label: "Actions",
    href: "/dashboard/actions",
    icon: Zap,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Policies",
    href: "/dashboard/policies",
    icon: ShieldCheck,
  },
  {
    label: "Audit Logs",
    href: "/dashboard/audit",
    icon: ClipboardList,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// ──────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Sidebar
 *
 * The dark left navigation panel. Always visible on desktop,
 * slides in as a drawer on mobile.
 *
 * Contains:
 * - RevivePay AI logo
 * - Primary navigation with expandable Workflows section
 * - AI Agent Status indicator at the bottom
 */
export default function Sidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();

  // Track which nav group is expanded (only "Workflows" for now)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    "Workflows"
  );

  const isActive = (href: string) => pathname === href;

  const isGroupActive = (item: NavItem) => {
    if (item.href) return isActive(item.href);
    return item.children?.some((child) => isActive(child.href)) ?? false;
  };

  return (
    <>
      {/* ── Sidebar container ───────────────────────────── */}
      <aside
        style={{
          width: "var(--sidebar-width)",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
        }}
        className={[
          "fixed inset-y-0 left-0 z-30 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          // On mobile: slide in/out based on isOpen
          "lg:relative lg:translate-x-0 shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5">
            {/* Logo mark — a small animated gradient orb */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
              }}
            >
              <Bot className="h-4 w-4 text-white" />
            </div>

            <div>
              <p className="text-sm font-bold leading-none" style={{ color: "var(--text-primary)" }}>
                RevivePay AI
              </p>
              <p className="mt-0.5 text-[10px] leading-none" style={{ color: "var(--text-muted)" }}>
                Revenue Recovery Agent
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            // Expandable group (e.g. Workflows)
            if (item.children) {
              const isExpanded = expandedGroup === item.label;
              const groupActive = isGroupActive(item);

              return (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : item.label)
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors"
                    style={{
                      color: groupActive ? "var(--text-primary)" : "var(--text-secondary)",
                      background: groupActive ? "var(--bg-elevated)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!groupActive) {
                        (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!groupActive) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>

                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                    )}
                  </button>

                  {/* Child links */}
                  {isExpanded && (
                    <div className="mt-0.5 ml-3 space-y-0.5 border-l pl-3" style={{ borderColor: "var(--border-subtle)" }}>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                          style={{
                            color: isActive(child.href)
                              ? "var(--accent-primary)"
                              : "var(--text-muted)",
                            background: isActive(child.href)
                              ? "var(--accent-primary-dim)"
                              : "transparent",
                          }}
                        >
                          <CreditCard className="h-3.5 w-3.5 shrink-0" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular nav link
            const active = isActive(item.href!);

            return (
              <Link
                key={item.label}
                href={item.href!}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  background: active ? "var(--bg-elevated)" : "transparent",
                  borderLeft: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
                }}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── AI Agent Status ───────────────────────────── */}
        <div
          className="px-4 py-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div
            className="rounded-xl p-3"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                AI Agent Status
              </p>
              <div className="flex items-center gap-1.5">
                <span className="status-dot" />
                <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>
                  Active
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1.5">
              <AgentStat label="Uptime" value="99.8%" />
              <AgentStat label="Events Processed" value="24,532" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// Small stat row inside the AI Agent Status box
function AgentStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}
