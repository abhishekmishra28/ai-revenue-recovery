import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "AI Revenue Recovery API",
      version: "1.0.0",

      description: `
# AI Revenue Recovery Engine

An AI-powered revenue recovery platform that detects failed
payment events, creates recovery cases, generates recovery
strategies, validates them against merchant policies, executes
recovery actions, records outcomes, attributes recovered revenue,
and maintains a complete audit trail.

## Recovery Pipeline

Revenue Event
→ Event Processing
→ Recovery Case
→ AI Strategy
→ Policy Validation
→ Recovery Action
→ Action Execution
→ Outcome
→ Revenue Attribution
→ Audit Trail

## Core Design Principles

- AI proposes recovery strategies.
- Merchant policies determine whether strategies are allowed.
- Only validated strategies can create recovery actions.
- Recovery actions are idempotent.
- Every important decision and state transition is auditable.
- Revenue attribution occurs only for successful recovery outcomes.
- Already processed revenue events are protected from duplicate processing.
      `.trim(),

      contact: {
        name: "AI Revenue Recovery",
      },

      license: {
        name: "MIT",
      },
    },

    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development",
      },

      {
        url: "https://api.example.com",
        description: "Production",
      },
    ],

    tags: [
      {
        name: "Health",
        description:
          "Service and database health checks.",
      },

      {
        name: "Merchants",
        description:
          "Merchant information and configuration.",
      },

      {
        name: "Customers",
        description:
          "Customer information.",
      },

      {
        name: "Transactions",
        description:
          "Payment transaction information.",
      },

      {
        name: "Revenue Events",
        description:
          "Revenue events entering the recovery system.",
      },

      {
        name: "Recovery Cases",
        description:
          "Cases created when revenue recovery may be required.",
      },

      {
        name: "AI Decisions",
        description:
          "AI-generated recovery strategy decisions.",
      },

      {
        name: "AI Strategy Engine",
        description:
          "Generates AI-powered recovery strategies.",
      },

      {
        name: "Policy Engine",
        description:
          "Validates AI strategies against merchant policies.",
      },

      {
        name: "Recovery Actions",
        description:
          "Recovery actions created from validated strategies.",
      },

      {
        name: "Action Execution",
        description:
          "Executes recovery actions against payment providers.",
      },

      {
        name: "Outcomes",
        description:
          "Results of recovery action execution.",
      },

      {
        name: "Revenue Attribution",
        description:
          "Attributes successfully recovered revenue.",
      },

      {
        name: "Audit Events",
        description:
          "Immutable-style audit trail for recovery operations.",
      },

      {
        name: "Recovery Orchestrator",
        description:
          "End-to-end recovery pipeline orchestration.",
      },

      {
        name: "Recovery Engine",
        description:
          "High-level recovery processing.",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT authentication token.",
        },
      },

      parameters: {
        UUID: {
          name: "id",
          in: "path",
          required: true,

          description:
            "Unique resource identifier.",

          schema: {
            type: "string",
            format: "uuid",
          },

          example:
            "6ef6fd64-bed9-4e22-92d0-48a531914473",
        },

        RevenueEventId: {
          name: "revenueEventId",
          in: "path",
          required: true,

          description:
            "Revenue event that should enter the recovery pipeline.",

          schema: {
            type: "string",
            format: "uuid",
          },

          example:
            "3d3919de-c7d9-4cf1-b0f2-c3bc2752f4fc",
        },

        RecoveryCaseId: {
          name: "recoveryCaseId",
          in: "path",
          required: true,

          description:
            "Recovery case identifier.",

          schema: {
            type: "string",
            format: "uuid",
          },

          example:
            "6ef6fd64-bed9-4e22-92d0-48a531914473",
        },

        MerchantId: {
          name: "merchantId",
          in: "path",
          required: true,

          description:
            "Merchant identifier.",

          schema: {
            type: "string",
            format: "uuid",
          },

          example:
            "00000000-0000-4000-8000-000000000001",
        },

        CustomerId: {
          name: "customerId",
          in: "path",
          required: true,

          description:
            "Customer identifier.",

          schema: {
            type: "string",
            format: "uuid",
          },

          example:
            "00000000-0000-4000-8000-000000000104",
        },
      },

      schemas: {
        ErrorResponse: {
          type: "object",

          required: [
            "error",
          ],

          properties: {
            error: {
              type: "string",
              example:
                "Failed to process recovery event",
            },

            code: {
              type: "string",
              example:
                "RECOVERY_PROCESSING_FAILED",
            },

            details: {
              type: "object",
              additionalProperties: true,
            },
          },
        },

        SuccessResponse: {
          type: "object",

          properties: {
            data: {
              type: "object",
              additionalProperties: true,
            },
          },
        },

        RevenueEvent: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            merchantId: {
              type: "string",
              format: "uuid",
            },

            transactionId: {
              type: "string",
              format: "uuid",
            },

            customerId: {
              type: "string",
              format: "uuid",
            },

            eventType: {
              type: "string",
              example:
                "PAYMENT_FAILED",
            },

            processedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },

        RecoveryCase: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            merchantId: {
              type: "string",
              format: "uuid",
            },

            customerId: {
              type: "string",
              format: "uuid",
            },

            transactionId: {
              type: "string",
              format: "uuid",
            },

            revenueEventId: {
              type: "string",
              format: "uuid",
            },

            caseType: {
              type: "string",
              example:
                "FAILED_PAYMENT",
            },

            status: {
              type: "string",
              enum: [
                "OPEN",
                "RECOVERED",
                "CLOSED",
              ],
              example: "OPEN",
            },

            priority: {
              type: "string",
              enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
              ],
            },

            riskLevel: {
              type: "string",
              enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
              ],
            },

            estimatedRecovery: {
              type: "string",
              example: "3999",
            },

            currency: {
              type: "string",
              example: "INR",
            },

            openedAt: {
              type: "string",
              format: "date-time",
            },

            closedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },

        StrategyDecision: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            recoveryCaseId: {
              type: "string",
              format: "uuid",
            },

            decision: {
              type: "string",
              enum: [
                "RETRY_PAYMENT",
                "SEND_REMINDER",
                "CHANGE_PAYMENT_METHOD",
                "NO_ACTION",
              ],
            },

            confidence: {
              type: "string",
              example: "0.9",
            },

            reason: {
              type: "string",
              example:
                "The payment failed due to insufficient funds, which is a transient failure eligible for retry.",
            },

            expectedRecovery: {
              type: "string",
              example: "3999",
            },

            riskLevel: {
              type: "string",
              enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
              ],
            },

            tool: {
              type: "string",
              example:
                "gemini-recovery-engine",
            },

            model: {
              type: "string",
              example:
                "gemini-3.6-flash",
            },

            promptVersion: {
              type: "string",
              example:
                "v3-gemini",
            },

            status: {
              type: "string",
              enum: [
                "PENDING",
                "VALIDATED",
                "REJECTED",
              ],
            },

            evidence: {
              type: "object",
              additionalProperties: true,
            },

            parameters: {
              type: "object",
              additionalProperties: true,
            },
          },
        },

        RecoveryAction: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            recoveryCaseId: {
              type: "string",
              format: "uuid",
            },

            strategyDecisionId: {
              type: "string",
              format: "uuid",
            },

            actionType: {
              type: "string",
              example:
                "RETRY_PAYMENT",
            },

            status: {
              type: "string",
              enum: [
                "PENDING",
                "EXECUTING",
                "SUCCEEDED",
                "FAILED",
              ],
            },

            idempotencyKey: {
              type: "string",
              example:
                "strategy-decision:960f8914-62db-45ca-98c4-9cf55fb7d96f",
            },

            executedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },

            completedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },

            errorCode: {
              type: "string",
              nullable: true,
            },

            errorMessage: {
              type: "string",
              nullable: true,
            },
          },
        },

        RecoveryOutcome: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            recoveryCaseId: {
              type: "string",
              format: "uuid",
            },

            recoveryActionId: {
              type: "string",
              format: "uuid",
            },

            status: {
              type: "string",
              enum: [
                "SUCCESS",
                "FAILED",
              ],
            },

            failureReason: {
              type: "string",
              nullable: true,
            },

            recoveredAmount: {
              type: "string",
              nullable: true,
              example: "3999",
            },

            currency: {
              type: "string",
              example: "INR",
            },

            occurredAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        RevenueAttribution: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            recoveryCaseId: {
              type: "string",
              format: "uuid",
            },

            outcomeId: {
              type: "string",
              format: "uuid",
            },

            amount: {
              type: "string",
              example: "3999",
            },

            currency: {
              type: "string",
              example: "INR",
            },

            attributionType: {
              type: "string",
              enum: [
                "DIRECT",
                "ASSISTED",
              ],
            },

            attributedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        AuditEvent: {
          type: "object",

          properties: {
            id: {
              type: "string",
              format: "uuid",
            },

            merchantId: {
              type: "string",
              format: "uuid",
            },

            recoveryCaseId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },

            eventType: {
              type: "string",
              example:
                "AI_STRATEGY_GENERATED",
            },

            actorType: {
              type: "string",
              enum: [
                "AI",
                "SYSTEM",
                "USER",
              ],
            },

            actorId: {
              type: "string",
              nullable: true,
            },

            metadata: {
              type: "object",
              additionalProperties: true,
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        RecoveryPipelineResponse: {
          type: "object",

          properties: {
            status: {
              type: "string",

              enum: [
                "ALREADY_PROCESSED",
                "NO_RECOVERY_REQUIRED",
                "POLICY_REJECTED",
                "RECOVERY_SUCCEEDED",
                "RECOVERY_FAILED",
              ],
            },

            event: {
              $ref:
                "#/components/schemas/RevenueEvent",
            },

            recoveryCase: {
              allOf: [
                {
                  $ref:
                    "#/components/schemas/RecoveryCase",
                },
              ],
              nullable: true,
            },

            strategyDecision: {
              allOf: [
                {
                  $ref:
                    "#/components/schemas/StrategyDecision",
                },
              ],
              nullable: true,
            },

            validatedDecision: {
              allOf: [
                {
                  $ref:
                    "#/components/schemas/StrategyDecision",
                },
              ],
              nullable: true,
            },

            recoveryAction: {
              allOf: [
                {
                  $ref:
                    "#/components/schemas/RecoveryAction",
                },
              ],
              nullable: true,
            },

            outcome: {
              allOf: [
                {
                  $ref:
                    "#/components/schemas/RecoveryOutcome",
                },
              ],
              nullable: true,
            },

            attribution: {
              allOf: [
                {
                  $ref:
                    "#/components/schemas/RevenueAttribution",
                },
              ],
              nullable: true,
            },
          },
        },
      },
    },
  },

  apis: [
    "./src/modules/**/*.routes.ts",
  ],
};

export const swaggerSpec =
  swaggerJsdoc(options);