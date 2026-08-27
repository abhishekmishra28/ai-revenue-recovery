"use client";

import { AuditEvent, RecoveryCase } from "@/types/recovery";

type Props = {
  recoveryCases: RecoveryCase[];
  auditEvents: AuditEvent[];
};

export default function AIInsights({ recoveryCases, auditEvents }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center h-80 text-slate-500">
      AI Insights Placeholder
    </div>
  );
}
