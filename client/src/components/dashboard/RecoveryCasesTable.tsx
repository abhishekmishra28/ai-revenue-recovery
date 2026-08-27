"use client";

import { RecoveryCase } from "@/types/recovery";

type Props = {
  recoveryCases: RecoveryCase[];
};

export default function RecoveryCasesTable({ recoveryCases }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Recovery Cases</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="px-4 py-3">Case ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk Level</th>
              <th className="px-4 py-3">Estimated Recovery</th>
            </tr>
          </thead>
          <tbody>
            {recoveryCases.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center">No cases found.</td>
              </tr>
            ) : (
              recoveryCases.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3">{c.riskLevel}</td>
                  <td className="px-4 py-3">{c.estimatedRecovery ?? "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}