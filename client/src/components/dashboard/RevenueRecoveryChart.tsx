"use client";

import { RecoveryCase, RecoveryOutcome, RevenueAttribution } from "@/types/recovery";

type Props = {
  recoveryCases: RecoveryCase[];
  outcomes: RecoveryOutcome[];
  attributions: RevenueAttribution[];
};

export default function RevenueRecoveryChart({ recoveryCases, outcomes, attributions }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center h-80 text-slate-500">
      Revenue Recovery Chart Placeholder
    </div>
  );
}
