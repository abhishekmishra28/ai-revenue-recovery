"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import type { RecoveryCase } from "@/types/recovery";

type RecoveryCasesTableProps = {
  cases: RecoveryCase[];
  onSelectCase?: (recoveryCase: RecoveryCase) => void;
};

function formatCurrency(
  value: string | number | null,
  currency: string,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount =
    typeof value === "string"
      ? Number(value)
      : value;

  if (Number.isNaN(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusConfig(status: RecoveryCase["status"]) {
  switch (status) {
    case "RECOVERED":
      return {
        label: "Recovered",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ),
      };

    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className:
          "bg-blue-50 text-blue-700 border-blue-200",
        icon: (
          <Clock3 className="h-3.5 w-3.5" />
        ),
      };

    case "FAILED":
      return {
        label: "Failed",
        className:
          "bg-red-50 text-red-700 border-red-200",
        icon: (
          <XCircle className="h-3.5 w-3.5" />
        ),
      };

    case "CLOSED":
      return {
        label: "Closed",
        className:
          "bg-slate-100 text-slate-600 border-slate-200",
        icon: (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ),
      };

    case "OPEN":
    default:
      return {
        label: "Open",
        className:
          "bg-amber-50 text-amber-700 border-amber-200",
        icon: (
          <AlertCircle className="h-3.5 w-3.5" />
        ),
      };
  }
}

function priorityConfig(
  priority: RecoveryCase["priority"],
) {
  switch (priority) {
    case "CRITICAL":
      return "text-red-700 bg-red-50";

    case "HIGH":
      return "text-orange-700 bg-orange-50";

    case "MEDIUM":
      return "text-amber-700 bg-amber-50";

    case "LOW":
    default:
      return "text-slate-600 bg-slate-100";
  }
}

function riskConfig(
  riskLevel: RecoveryCase["riskLevel"],
) {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-red-700";

    case "HIGH":
      return "text-orange-700";

    case "MEDIUM":
      return "text-amber-700";

    case "LOW":
    default:
      return "text-emerald-700";
  }
}

export default function RecoveryCasesTable({
  cases,
  onSelectCase,
}: RecoveryCasesTableProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Recovery Cases
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest payment recovery opportunities.
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          {cases.length}{" "}
          {cases.length === 1 ? "case" : "cases"}
        </div>
      </div>

      {/* Empty state */}
      {cases.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <CheckCircle2 className="h-5 w-5 text-slate-500" />
          </div>

          <p className="mt-3 text-sm font-medium text-slate-800">
            No recovery cases found
          </p>

          <p className="mt-1 max-w-sm text-xs text-slate-500">
            There are currently no recovery cases to
            display.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Case
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Transaction
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Risk
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Opportunity
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cases.map((recoveryCase) => {
                  const status = statusConfig(
                    recoveryCase.status,
                  );

                  return (
                    <tr
                      key={recoveryCase.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Case */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {recoveryCase.caseType ||
                              "Payment Recovery"}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {shortId(
                              recoveryCase.id,
                            )}
                          </p>
                        </div>
                      </td>

                      {/* Transaction */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-mono text-xs text-slate-700">
                            {shortId(
                              recoveryCase.transactionId,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Customer{" "}
                            {shortId(
                              recoveryCase.customerId,
                            )}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-medium ${priorityConfig(
                            recoveryCase.priority,
                          )}`}
                        >
                          {recoveryCase.priority}
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold ${riskConfig(
                            recoveryCase.riskLevel,
                          )}`}
                        >
                          {recoveryCase.riskLevel}
                        </span>
                      </td>

                      {/* Opportunity */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(
                            recoveryCase.estimatedRecovery,
                            recoveryCase.currency,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Opened{" "}
                          {formatDate(
                            recoveryCase.openedAt,
                          )}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectCase?.(
                              recoveryCase,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {cases.map((recoveryCase) => {
              const status = statusConfig(
                recoveryCase.status,
              );

              return (
                <div
                  key={recoveryCase.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {recoveryCase.caseType ||
                          "Payment Recovery"}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {shortId(recoveryCase.id)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Transaction
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-700">
                        {shortId(
                          recoveryCase.transactionId,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Opportunity
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(
                          recoveryCase.estimatedRecovery,
                          recoveryCase.currency,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Priority
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-md px-2 py-1 text-xs font-medium ${priorityConfig(
                          recoveryCase.priority,
                        )}`}
                      >
                        {recoveryCase.priority}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Risk
                      </p>

                      <p
                        className={`mt-1 text-xs font-semibold ${riskConfig(
                          recoveryCase.riskLevel,
                        )}`}
                      >
                        {recoveryCase.riskLevel}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSelectCase?.(
                        recoveryCase,
                      )
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View Recovery Case
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}