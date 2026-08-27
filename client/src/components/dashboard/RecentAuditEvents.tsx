"use client";

import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GitBranch,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import type { AuditEvent } from "@/types/recovery";

type RecentAuditEventsProps = {
  events: AuditEvent[];
  limit?: number;
};

function shortId(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return `${value.slice(0, 8)}...`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getEventConfig(eventType: string) {
  switch (eventType) {
    case "AI_STRATEGY_GENERATED":
      return {
        label: "AI Strategy Generated",
        icon: (
          <BrainCircuit className="h-4 w-4" />
        ),
        iconClassName:
          "bg-violet-50 text-violet-600",
      };

    case "AI_STRATEGY_VALIDATED":
      return {
        label: "AI Strategy Validated",
        icon: (
          <ShieldCheck className="h-4 w-4" />
        ),
        iconClassName:
          "bg-blue-50 text-blue-600",
      };

    case "AI_STRATEGY_REJECTED":
      return {
        label: "AI Strategy Rejected",
        icon: (
          <XCircle className="h-4 w-4" />
        ),
        iconClassName:
          "bg-red-50 text-red-600",
      };

    case "RECOVERY_ACTION_CREATED":
      return {
        label: "Recovery Action Created",
        icon: (
          <GitBranch className="h-4 w-4" />
        ),
        iconClassName:
          "bg-slate-100 text-slate-600",
      };

    case "RECOVERY_ACTION_EXECUTING":
      return {
        label: "Recovery Action Executing",
        icon: (
          <Play className="h-4 w-4" />
        ),
        iconClassName:
          "bg-amber-50 text-amber-600",
      };

    case "RECOVERY_ACTION_SUCCEEDED":
      return {
        label: "Recovery Action Succeeded",
        icon: (
          <CheckCircle2 className="h-4 w-4" />
        ),
        iconClassName:
          "bg-emerald-50 text-emerald-600",
      };

    case "RECOVERY_ACTION_FAILED":
      return {
        label: "Recovery Action Failed",
        icon: (
          <XCircle className="h-4 w-4" />
        ),
        iconClassName:
          "bg-red-50 text-red-600",
      };

    case "REVENUE_ATTRIBUTED":
      return {
        label: "Revenue Attributed",
        icon: (
          <CircleDollarSign className="h-4 w-4" />
        ),
        iconClassName:
          "bg-emerald-50 text-emerald-600",
      };

    default:
      return {
        label: eventType
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (char) =>
            char.toUpperCase(),
          ),
        icon: (
          <Clock3 className="h-4 w-4" />
        ),
        iconClassName:
          "bg-slate-100 text-slate-600",
      };
  }
}

function getEventDescription(
  event: AuditEvent,
) {
  const metadata = event.metadata || {};

  switch (event.eventType) {
    case "AI_STRATEGY_GENERATED":
      return (
        typeof metadata.reason === "string"
          ? metadata.reason
          : `AI selected ${
              metadata.decision || "a recovery strategy"
            }.`
      );

    case "AI_STRATEGY_VALIDATED":
      return (
        typeof metadata.policyName === "string"
          ? `Approved by policy: ${metadata.policyName}`
          : "AI strategy passed merchant policy validation."
      );

    case "AI_STRATEGY_REJECTED":
      return (
        typeof metadata.reason === "string"
          ? metadata.reason
          : "AI strategy was rejected by the policy engine."
      );

    case "RECOVERY_ACTION_CREATED":
      return (
        typeof metadata.actionType === "string"
          ? `${metadata.actionType} action was created.`
          : "A recovery action was created."
      );

    case "RECOVERY_ACTION_EXECUTING":
      return (
        typeof metadata.actionType === "string"
          ? `${metadata.actionType} action is being executed.`
          : "Recovery action execution started."
      );

    case "RECOVERY_ACTION_SUCCEEDED":
      return (
        typeof metadata.recoveredAmount !==
        "undefined"
          ? `Recovered ${metadata.recoveredAmount} ${
              metadata.currency || ""
            } successfully.`
          : "Recovery action completed successfully."
      );

    case "RECOVERY_ACTION_FAILED":
      return (
        typeof metadata.errorMessage === "string"
          ? metadata.errorMessage
          : "Recovery action failed."
      );

    case "REVENUE_ATTRIBUTED":
      return (
        typeof metadata.amount !== "undefined"
          ? `${metadata.amount} ${
              metadata.currency || ""
            } attributed as recovered revenue.`
          : "Recovered revenue was attributed."
      );

    default:
      return "System audit event recorded.";
  }
}

function getActorLabel(
  event: AuditEvent,
) {
  switch (event.actorType) {
    case "AI":
      return "AI";

    case "SYSTEM":
      return "System";

    case "MERCHANT":
      return "Merchant";

    case "USER":
      return "User";

    default:
      return event.actorType;
  }
}

export default function RecentAuditEvents({
  events,
  limit = 8,
}: RecentAuditEventsProps) {
  const visibleEvents = events.slice(0, limit);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            AI decisions and recovery execution timeline.
          </p>
        </div>

        <div className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 sm:flex">
          <Clock3 className="h-3.5 w-3.5 text-slate-500" />

          <span className="text-xs font-medium text-slate-600">
            Live audit trail
          </span>
        </div>
      </div>

      {/* Empty state */}
      {visibleEvents.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <Clock3 className="h-5 w-5 text-slate-500" />
          </div>

          <p className="mt-3 text-sm font-medium text-slate-800">
            No audit events yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recovery activity will appear here.
          </p>
        </div>
      ) : (
        <div className="p-5">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute bottom-4 left-5 top-4 w-px bg-slate-200" />

            <div className="space-y-6">
              {visibleEvents.map(
                (event) => {
                  const config =
                    getEventConfig(
                      event.eventType,
                    );

                  return (
                    <div
                      key={event.id}
                      className="relative flex gap-4"
                    >
                      {/* Icon */}
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconClassName}`}
                      >
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {config.label}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {getEventDescription(
                                event,
                              )}
                            </p>
                          </div>

                          <span className="shrink-0 text-[11px] text-slate-400">
                            {formatDate(
                              event.createdAt,
                            )}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                            {getActorLabel(
                              event,
                            )}
                          </span>

                          {event.recoveryCaseId && (
                            <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-400">
                              Case{" "}
                              {shortId(
                                event.recoveryCaseId,
                              )}
                            </span>
                          )}

                          {typeof event.metadata
                            ?.decision ===
                            "string" && (
                            <span className="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-600">
                              {
                                event
                                  .metadata
                                  .decision
                              }
                            </span>
                          )}

                          {typeof event.metadata
                            ?.actionType ===
                            "string" && (
                            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-600">
                              {
                                event
                                  .metadata
                                  .actionType
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}