"use client";
import { useRouter } from "next/navigation";

interface Stage {
  label: string;
  icon: string;
  count?: number;
  href?: string;
  color: string;
  bg: string;
}

interface PipelineFlowProps {
  stages?: Stage[];
  animated?: boolean;
  compact?: boolean;
}

const defaultStages: Stage[] = [
  {
    label: "Revenue\nEvent",
    icon: "⚡",
    href: "/revenue-events",
    color: "var(--gold)",
    bg: "var(--gold-dim)",
  },
  {
    label: "Recovery\nCase",
    icon: "📋",
    href: "/recovery-cases",
    color: "var(--blue)",
    bg: "var(--blue-dim)",
  },
  {
    label: "AI\nStrategy",
    icon: "🧠",
    href: "/ai-decisions",
    color: "var(--purple)",
    bg: "var(--purple-dim)",
  },
  {
    label: "Policy\nCheck",
    icon: "🛡️",
    href: "/ai-decisions",
    color: "var(--orange)",
    bg: "var(--orange-dim)",
  },
  {
    label: "Recovery\nAction",
    icon: "⚙️",
    href: "/recovery-actions",
    color: "var(--blue)",
    bg: "var(--blue-dim)",
  },
  {
    label: "Outcome",
    icon: "📊",
    href: "/outcomes",
    color: "var(--green)",
    bg: "var(--green-dim)",
  },
  {
    label: "Attribution",
    icon: "💰",
    href: "/revenue-attribution",
    color: "var(--gold)",
    bg: "var(--gold-dim)",
  },
];

export default function PipelineFlow({
  stages = defaultStages,
  animated = true,
  compact = false,
}: PipelineFlowProps) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      {stages.map((stage, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", flex: i < stages.length - 1 ? "0 0 auto" : "0 0 auto" }}
        >
          {/* Node */}
          <div
            onClick={() => stage.href && router.push(stage.href)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: compact ? 6 : 10,
              cursor: stage.href ? "pointer" : "default",
              minWidth: compact ? 64 : 80,
            }}
          >
            <div
              style={{
                width: compact ? 40 : 52,
                height: compact ? 40 : 52,
                borderRadius: compact ? 10 : 14,
                background: stage.bg,
                border: `1.5px solid ${stage.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: compact ? 16 : 22,
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: `0 0 12px ${stage.bg}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${stage.color}40`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${stage.bg}`;
              }}
            >
              {stage.icon}
            </div>

            <div
              style={{
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {stage.label.split("\n").map((line, li) => (
                <div
                  key={li}
                  style={{
                    fontSize: compact ? 10 : 11,
                    fontWeight: li === 0 ? 600 : 400,
                    color: li === 0 ? "var(--text-primary)" : "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {stage.count !== undefined && (
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: stage.color,
                  background: stage.bg,
                  padding: "2px 8px",
                  borderRadius: 100,
                }}
              >
                {stage.count}
              </div>
            )}
          </div>

          {/* Connector */}
          {i < stages.length - 1 && (
            <div
              style={{
                width: compact ? 24 : 36,
                height: 2,
                background: "var(--border-dim)",
                position: "relative",
                overflow: "hidden",
                marginBottom: compact ? 24 : 32,
                flexShrink: 0,
              }}
            >
              {animated && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: "60%",
                    background: `linear-gradient(90deg, ${stages[i].color}, ${stages[i + 1].color})`,
                    animation: `pipeline-flow ${1.8 + i * 0.15}s linear infinite`,
                  }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
