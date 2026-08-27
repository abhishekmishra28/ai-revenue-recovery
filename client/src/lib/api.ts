import type {
  ApiResponse,
  AuditEvent,
  RecoveryCase,
  RecoveryOutcome,
  RevenueAttribution,
  RevenueEvent,
  StrategyDecision,
} from "@/types/recovery";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },

      cache: "no-store",
    },
  );

  if (!response.ok) {
    let message =
      `API request failed: ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message);
  }

  return response.json();
}

/* =========================================================
   HEALTH
========================================================= */

export const api = {
  health: {
    get: () =>
      request<ApiResponse<unknown>>(
        "/health",
      ),

    database: () =>
      request<ApiResponse<unknown>>(
        "/health/db",
      ),
  },

  /* =======================================================
     MERCHANTS
  ======================================================= */

  merchants: {
    list: () =>
      request<ApiResponse<unknown[]>>(
        "/merchants",
      ),

    get: (id: string) =>
      request<ApiResponse<unknown>>(
        `/merchants/${id}`,
      ),
  },

  /* =======================================================
     CUSTOMERS
  ======================================================= */

  customers: {
    list: () =>
      request<ApiResponse<unknown[]>>(
        "/customers",
      ),

    byMerchant: (merchantId: string) =>
      request<ApiResponse<unknown[]>>(
        `/customers/merchant/${merchantId}`,
      ),

    get: (id: string) =>
      request<ApiResponse<unknown>>(
        `/customers/${id}`,
      ),
  },

  /* =======================================================
     TRANSACTIONS
  ======================================================= */

  transactions: {
    list: () =>
      request<ApiResponse<unknown[]>>(
        "/transactions",
      ),

    byCustomer: (customerId: string) =>
      request<ApiResponse<unknown[]>>(
        `/transactions/customer/${customerId}`,
      ),

    byMerchant: (merchantId: string) =>
      request<ApiResponse<unknown[]>>(
        `/transactions/merchant/${merchantId}`,
      ),

    get: (id: string) =>
      request<ApiResponse<unknown>>(
        `/transactions/${id}`,
      ),
  },

  /* =======================================================
     REVENUE EVENTS
  ======================================================= */

  revenueEvents: {
    list: () =>
      request<ApiResponse<RevenueEvent[]>>(
        "/revenue-events",
      ),

    byMerchant: (merchantId: string) =>
      request<ApiResponse<RevenueEvent[]>>(
        `/revenue-events/merchant/${merchantId}`,
      ),

    byCustomer: (customerId: string) =>
      request<ApiResponse<RevenueEvent[]>>(
        `/revenue-events/customer/${customerId}`,
      ),

    get: (id: string) =>
      request<ApiResponse<RevenueEvent>>(
        `/revenue-events/${id}`,
      ),
  },

  /* =======================================================
     RECOVERY CASES
  ======================================================= */

  recoveryCases: {
    list: () =>
      request<ApiResponse<RecoveryCase[]>>(
        "/recovery-cases",
      ),

    get: (id: string) =>
      request<ApiResponse<RecoveryCase>>(
        `/recovery-cases/${id}`,
      ),
  },

  /* =======================================================
     AI DECISIONS
  ======================================================= */

  aiDecisions: {
    list: () =>
      request<ApiResponse<StrategyDecision[]>>(
        "/ai-decisions",
      ),

    get: (id: string) =>
      request<ApiResponse<StrategyDecision>>(
        `/ai-decisions/${id}`,
      ),
  },

  /* =======================================================
     OUTCOMES
  ======================================================= */

  outcomes: {
    list: () =>
      request<ApiResponse<RecoveryOutcome[]>>(
        "/outcomes",
      ),

    get: (id: string) =>
      request<ApiResponse<RecoveryOutcome>>(
        `/outcomes/${id}`,
      ),

    byRecoveryCase: (recoveryCaseId: string) =>
      request<ApiResponse<RecoveryOutcome[]>>(
        `/outcomes/recovery-case/${recoveryCaseId}`,
      ),

    byAction: (recoveryActionId: string) =>
      request<ApiResponse<RecoveryOutcome[]>>(
        `/outcomes/recovery-action/${recoveryActionId}`,
      ),
  },

  /* =======================================================
     REVENUE ATTRIBUTION
  ======================================================= */

  revenueAttribution: {
    list: () =>
      request<ApiResponse<RevenueAttribution[]>>(
        "/revenue-attribution",
      ),

    get: (id: string) =>
      request<ApiResponse<RevenueAttribution>>(
        `/revenue-attribution/${id}`,
      ),

    byMerchant: (merchantId: string) =>
      request<ApiResponse<RevenueAttribution[]>>(
        `/revenue-attribution/merchant/${merchantId}`,
      ),

    byRecoveryCase: (recoveryCaseId: string) =>
      request<ApiResponse<RevenueAttribution[]>>(
        `/revenue-attribution/recovery-case/${recoveryCaseId}`,
      ),
  },

  /* =======================================================
     AUDIT EVENTS
  ======================================================= */

  audit: {
    all: () =>
      request<ApiResponse<AuditEvent[]>>(
        "/audit-events",
      ),

    get: (id: string) =>
      request<ApiResponse<AuditEvent>>(
        `/audit-events/${id}`,
      ),

    byMerchant: (merchantId: string) =>
      request<ApiResponse<AuditEvent[]>>(
        `/audit-events/merchant/${merchantId}`,
      ),

    byRecoveryCase: (recoveryCaseId: string) =>
      request<ApiResponse<AuditEvent[]>>(
        `/audit-events/recovery-case/${recoveryCaseId}`,
      ),
  },

  /* =======================================================
     RECOVERY ORCHESTRATOR
  ======================================================= */

  recoveryOrchestrator: {
    processRevenueEvent: (
      revenueEventId: string,
    ) =>
      request<ApiResponse<unknown>>(
        `/recovery-orchestrator/revenue-event/${revenueEventId}`,
        {
          method: "POST",
        },
      ),
  },
};