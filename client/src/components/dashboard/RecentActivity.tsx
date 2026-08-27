"use client";

import { AuditEvent } from "@/types/recovery";
import RecentAuditEvents from "./RecentAuditEvents";

type Props = {
  auditEvents: AuditEvent[];
};

export default function RecentActivity({ auditEvents }: Props) {
  return <RecentAuditEvents events={auditEvents} />;
}
