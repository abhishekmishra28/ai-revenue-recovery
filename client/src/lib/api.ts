import type {
  Merchant,
  Customer,
  Transaction,
  RevenueEvent,
  RecoveryCase,
  AIStrategyDecision,
  RecoveryAction,
  Outcome,
  RevenueAttribution,
  AuditEvent,
  RecoveryPipelineResponse,
  HealthStatus,
  SimulateResponse,
  ScenarioInput,
  Policy,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
async function fetchData<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetchApi<{ data: T }>(path, options);
  return response.data;
}
export const api = {
  health: () => fetchApi<HealthStatus>("/health"),

  merchants: {
    list: () => fetchData<Merchant[]>("/merchants"),

    get: (id: string) =>
      fetchData<Merchant>(`/merchants/${id}`),
  },

  customers: {
    list: () => fetchApi<Customer[]>("/customers"),
    byMerchant: (merchantId: string) =>
      fetchApi<Customer[]>(`/customers/merchant/${merchantId}`),
    get: (id: string) => fetchApi<Customer>(`/customers/${id}`),
  },

  transactions: {
    list: () => fetchApi<Transaction[]>("/transactions"),
    byMerchant: (merchantId: string) =>
      fetchApi<Transaction[]>(`/transactions/merchant/${merchantId}`),
    get: (id: string) => fetchApi<Transaction>(`/transactions/${id}`),
  },

  revenueEvents: {
    list: async () => {
      const response = await fetchApi<{
        data: RevenueEvent[];
      }>("/revenue-events");

      return response.data;
    },

    byMerchant: async (merchantId: string) => {
      const response = await fetchApi<{
        data: RevenueEvent[];
      }>(`/revenue-events/merchant/${merchantId}`);

      return response.data;
    },

    get: async (id: string) => {
      const response = await fetchApi<{
        data: RevenueEvent;
      }>(`/revenue-events/${id}`);

      return response.data;
    },
  },

  recoveryCases: {
    list: async () => {
      const response = await fetchApi<{ data: RecoveryCase[] }>(
        "/recovery-cases"
      );

      return response.data;
    },

    get: async (id: string) => {
      const response = await fetchApi<{ data: RecoveryCase }>(
        `/recovery-cases/${id}`
      );

      return response.data;
    },
  },

  aiDecisions: {
    list: () =>
      fetchData<AIStrategyDecision[]>("/ai-decisions"),

    byCase: (caseId: string) =>
      fetchData<AIStrategyDecision[]>(
        `/ai-decisions/recovery-case/${caseId}`
      ),

    get: (id: string) =>
      fetchData<AIStrategyDecision>(
        `/ai-decisions/${id}`
      ),
  },

  recoveryActions: {
    list: () =>
      fetchData<RecoveryAction[]>("/recovery-actions"),

    byCase: (caseId: string) =>
      fetchData<RecoveryAction[]>(
        `/recovery-actions/recovery-case/${caseId}`
      ),

    get: (id: string) =>
      fetchData<RecoveryAction>(
        `/recovery-actions/${id}`
      ),
  },

  outcomes: {
    list: () =>
      fetchData<Outcome[]>("/outcomes"),

    byCase: (caseId: string) =>
      fetchData<Outcome[]>(
        `/outcomes/recovery-case/${caseId}`
      ),

    get: (id: string) =>
      fetchData<Outcome>(
        `/outcomes/${id}`
      ),
  },

  revenueAttributions: {
    list: async () => {
      const response = await fetchApi<{
        data: RevenueAttribution[];
      }>("/revenue-attribution");

      return response.data;
    },

    byCase: async (caseId: string) => {
      const response = await fetchApi<{
        data: RevenueAttribution[];
      }>(`/revenue-attribution/recovery-case/${caseId}`);

      return response.data;
    },

    get: async (id: string) => {
      const response = await fetchApi<{
        data: RevenueAttribution;
      }>(`/revenue-attribution/${id}`);

      return response.data;
    },
  },

  auditEvents: {
    list: async () => {
      const response = await fetchApi<{
        data: AuditEvent[];
      }>("/audit-events");

      return response.data;
    },

    byMerchant: async (merchantId: string) => {
      const response = await fetchApi<{
        data: AuditEvent[];
      }>(`/audit/merchant/${merchantId}`);

      return response.data;
    },

    byCase: async (caseId: string) => {
      const response = await fetchApi<{
        data: AuditEvent[];
      }>(`/audit/recovery-case/${caseId}`);

      return response.data;
    },

    get: async (id: string) => {
      const response = await fetchApi<{
        data: AuditEvent;
      }>(`/audit-events/${id}`);

      return response.data;
    },
  },

  orchestrator: {
    process: (revenueEventId: string) =>
      fetchApi<RecoveryPipelineResponse>(
        `/recovery-orchestrator/revenue-event/${revenueEventId}`,
        { method: "POST" }
      ),
  },

  strategyEngine: {
    generate: (recoveryCaseId: string) =>
      fetchApi<AIStrategyDecision>(
        `/ai-strategy-engine/generate/${recoveryCaseId}`,
        { method: "POST" }
      ),
  },

  policyEngine: {
    validate: (strategyDecisionId: string) =>
      fetchApi<AIStrategyDecision>(
        `/policy-engine/validate/${strategyDecisionId}`,
        { method: "POST" }
      ),
  },

  actionExecution: {
    execute: (recoveryActionId: string) =>
      fetchApi<RecoveryAction>(
        `/action-execution/execute/${recoveryActionId}`,
        { method: "POST" }
      ),
  },

  recoveryEngine: {
    detect: (revenueEventId: string) =>
      fetchApi<RecoveryCase>(
        `/recovery-engine/detect/${revenueEventId}`,
        { method: "POST" }
      ),
  },

  // ─── Policies ────────────────────────────────────────────────────────────────
  policies: {
    list: () => fetchData<Policy[]>("/policies"),
    byMerchant: (merchantId: string) =>
      fetchData<Policy[]>(`/policies/merchant/${merchantId}`),
  },

  // ─── Simulate (Scenario Simulator + Batch Runner) ───────────────────────────
  simulate: {
    runScenario: (input: ScenarioInput) =>
      fetchData<SimulateResponse>("/simulate/scenario", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
};

export { API_BASE };
