"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  AuditEvent,
  RecoveryCase,
  RecoveryOutcome,
  RevenueAttribution,
  RevenueEvent,
  StrategyDecision,
} from "@/types/recovery";

type DashboardData = {
  recoveryCases: RecoveryCase[];
  revenueEvents: RevenueEvent[];
  strategyDecisions: StrategyDecision[];
  outcomes: RecoveryOutcome[];
  attributions: RevenueAttribution[];
  auditEvents: AuditEvent[];
};

type DashboardState = DashboardData & {
  loading: boolean;
  error: string | null;
};

const initialData: DashboardData = {
  recoveryCases: [],
  revenueEvents: [],
  strategyDecisions: [],
  outcomes: [],
  attributions: [],
  auditEvents: [],
};

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    ...initialData,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const [
        recoveryCasesResponse,
        revenueEventsResponse,
        strategyDecisionsResponse,
        outcomesResponse,
        attributionsResponse,
        auditEventsResponse,
      ] = await Promise.all([
        api.recoveryCases.list(),
        api.revenueEvents.list(),
        api.aiDecisions.list(),
        api.outcomes.list(),
        api.revenueAttribution.list(),
        api.audit.all(),
      ]);

      setState({
        recoveryCases: recoveryCasesResponse.data ?? [],
        revenueEvents: revenueEventsResponse.data ?? [],
        strategyDecisions: strategyDecisionsResponse.data ?? [],
        outcomes: outcomesResponse.data ?? [],
        attributions: attributionsResponse.data ?? [],
        auditEvents: auditEventsResponse.data ?? [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);

      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data",
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    refresh: load,
  };
}