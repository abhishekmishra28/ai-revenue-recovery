"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Zap,
  FolderOpen,
  Brain,
  Play,
  BarChart3,
  GitBranch,
  ScrollText,
  Rocket,
  TrendingUp,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    links: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/orchestrator", label: "Orchestrator", icon: Rocket },
    ],
  },
  {
    label: "Data",
    links: [
      { href: "/merchants", label: "Merchants", icon: Store },
      { href: "/revenue-events", label: "Revenue Events", icon: Zap },
      { href: "/recovery-cases", label: "Recovery Cases", icon: FolderOpen },
    ],
  },
  {
    label: "Recovery Pipeline",
    links: [
      { href: "/ai-decisions", label: "AI Decisions", icon: Brain },
      { href: "/recovery-actions", label: "Recovery Actions", icon: Play },
      { href: "/outcomes", label: "Outcomes", icon: BarChart3 },
      { href: "/revenue-attribution", label: "Attribution", icon: TrendingUp },
    ],
  },
  {
    label: "System",
    links: [
      { href: "/audit", label: "Audit Trail", icon: ScrollText },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <GitBranch size={16} color="#0a0c14" strokeWidth={2.5} />
          </div>
          <div>
            <div className="sidebar-logo-text">
              Revive<span>Pay</span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              AI REVENUE RECOVERY
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingBottom: 16 }}>
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={15} className="icon" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-dim)",
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        AI Revenue Recovery Engine
        <br />
        <span style={{ color: "var(--gold)", opacity: 0.7 }}>
          Powered by Gemini
        </span>
      </div>
    </aside>
  );
}
