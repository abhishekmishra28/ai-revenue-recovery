import {
  ActorType,
  RecoveryStrategy,
  RiskLevel,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";

import { createAuditEvent } from "../audit/audit.service";

import { gemini } from "../../lib/gemini";

const PROMPT_VERSION = "v3-gemini";

const GEMINI_MODEL = "gemini-3.6-flash";

type GeminiStrategyResponse = {
  decision: string;
  confidence: number;
  reason: string;
  riskLevel: string;
};

const allowedStrategies = Object.values(
  RecoveryStrategy,
);

const allowedRiskLevels = Object.values(
  RiskLevel,
);

const parseGeminiResponse = (
  text: string,
): GeminiStrategyResponse => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Gemini returned invalid JSON",
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null
  ) {
    throw new Error(
      "Gemini returned an invalid strategy response",
    );
  }

  const response =
    parsed as Record<string, unknown>;

  if (
    typeof response.decision !== "string" ||
    typeof response.confidence !== "number" ||
    typeof response.reason !== "string" ||
    typeof response.riskLevel !== "string"
  ) {
    throw new Error(
      "Gemini response is missing required fields",
    );
  }

  if (
    !allowedStrategies.includes(
      response.decision as RecoveryStrategy,
    )
  ) {
    throw new Error(
      `Gemini returned unsupported recovery strategy: ${response.decision}`,
    );
  }

  if (
    !allowedRiskLevels.includes(
      response.riskLevel as RiskLevel,
    )
  ) {
    throw new Error(
      `Gemini returned unsupported risk level: ${response.riskLevel}`,
    );
  }

  if (
    response.confidence < 0 ||
    response.confidence > 1
  ) {
    throw new Error(
      "Gemini confidence must be between 0 and 1",
    );
  }

  return {
    decision: response.decision,
    confidence: response.confidence,
    reason: response.reason,
    riskLevel: response.riskLevel,
  };
};

export const generateStrategyDecision = async (
  recoveryCaseId: string,
) => {
  /*
   * 1. Load complete recovery context.
   */

  const recoveryCase =
    await prisma.recoveryCase.findUnique({
      where: {
        id: recoveryCaseId,
      },

      include: {
        customer: true,
        transaction: true,
        revenueEvent: true,
      },
    });

  if (!recoveryCase) {
    throw new Error(
      "Recovery case not found",
    );
  }

  /*
   * 2. Build the AI decision context.
   */

  const context = {
    recoveryCase: {
      id: recoveryCase.id,
      caseType: recoveryCase.caseType,
      status: recoveryCase.status,
      priority: recoveryCase.priority,
      riskLevel: recoveryCase.riskLevel,
      estimatedRecovery:
        recoveryCase.estimatedRecovery?.toString() ??
        null,
      currency: recoveryCase.currency,
    },

    transaction: recoveryCase.transaction
      ? {
          status:
            recoveryCase.transaction.status,

          amount:
            recoveryCase.transaction.amount.toString(),

          currency:
            recoveryCase.transaction.currency,

          paymentMethod:
            recoveryCase.transaction.paymentMethod,

          failureCode:
            recoveryCase.transaction.failureCode,
        }
      : null,

    customer: recoveryCase.customer
      ? {
          id: recoveryCase.customer.id,
        }
      : null,

    revenueEvent:
      recoveryCase.revenueEvent
        ? {
            eventType:
              recoveryCase.revenueEvent.eventType,

            payload:
              recoveryCase.revenueEvent.payload,
          }
        : null,
  };

  /*
   * 3. Ask Gemini for a recovery strategy.
   */

  const prompt = `
You are an AI revenue recovery decision engine.

Your job is to recommend ONE recovery strategy
for the supplied payment recovery case.

You must choose ONLY one of these strategies:

${allowedStrategies.join("\n")}

Risk level must be ONLY:

${allowedRiskLevels.join("\n")}

Analyze:
- payment failure reason
- transaction status
- payment method
- recovery case type
- priority
- risk level
- estimated recoverable revenue

Rules:

1. Do not invent facts.
2. Do not execute any action.
3. Do not provide explanations outside the JSON.
4. Return ONLY valid JSON.
5. Confidence must be between 0 and 1.
6. Treat the recovery case status as important:
   - If the case is already RECOVERED or CLOSED,
     choose NO_ACTION.
7. Use the revenue event payload as evidence when available.
8. For FAILED_PAYMENT:
   - A retry may be appropriate when the payment failure
     is transient and the transaction is eligible for retry.
9. For CHECKOUT_ABANDONMENT:
   - SEND_CHECKOUT_REMINDER is an appropriate recovery
     strategy when the checkout was abandoned.
10. For SUBSCRIPTION_FAILURE:
   - REQUEST_PAYMENT_METHOD_UPDATE is the preferred recovery
     strategy when a subscription payment has failed and
     there is no evidence that the case is already recovered,
     closed, or unsafe to recover.
11. Do not require a transaction object when the revenue event
    itself contains sufficient subscription or checkout context.
12. Use NO_ACTION only when the available evidence genuinely
    indicates that no safe recovery strategy can be selected.

Return exactly this structure:

{
  "decision": "RETRY_PAYMENT",
  "confidence": 0.90,
  "reason": "Short explanation",
  "riskLevel": "MEDIUM"
}

Recovery case:

${JSON.stringify(context, null, 2)}
`;

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,

    contents: prompt,

    config: {
      temperature: 0.1,

      responseMimeType:
        "application/json",
    },
  });

  const text =
    response.text?.trim();

  if (!text) {
    throw new Error(
      "Gemini returned an empty response",
    );
  }

  /*
   * 4. Validate Gemini output.
   */

  const aiDecision =
    parseGeminiResponse(text);

  /*
   * 5. Convert AI values into Prisma enums.
   */

  const decision =
    aiDecision.decision as RecoveryStrategy;

  const riskLevel =
    aiDecision.riskLevel as RiskLevel;

  /*
   * 6. Expected recovery comes from
   *    our database, not Gemini.
   */

  const expectedRecovery =
    recoveryCase.estimatedRecovery ??
    null;

  /*
   * 7. Persist the AI strategy decision.
   */

  const strategyDecision =
    await prisma.aIStrategyDecision.create({
      data: {
        recoveryCaseId:
          recoveryCase.id,

        decision,

        confidence:
          aiDecision.confidence,

        reason:
          aiDecision.reason,

        evidence: {
          caseType:
            recoveryCase.caseType,

          priority:
            recoveryCase.priority,

          recoveryCaseRiskLevel:
            recoveryCase.riskLevel,

          aiRiskLevel:
            riskLevel,

          transactionStatus:
            recoveryCase.transaction?.status ??
            null,

          paymentMethod:
            recoveryCase.transaction
              ?.paymentMethod ?? null,

          failureCode:
            recoveryCase.transaction
              ?.failureCode ?? null,

          revenueEventType:
            recoveryCase.revenueEvent
              ?.eventType ?? null,
          
           revenueEventPayload:
              recoveryCase.revenueEvent
                ?.payload ?? null,
        },

        expectedRecovery,

        riskLevel,

        tool: "gemini-recovery-engine",

        parameters: {
          recoveryCaseId:
            recoveryCase.id,
        },

        model: GEMINI_MODEL,

        promptVersion:
          PROMPT_VERSION,

        status: "GENERATED",
      },
    });

  /*
   * 8. Record AI decision in audit trail.
   */

  await createAuditEvent({
    merchantId:
      recoveryCase.merchantId,

    recoveryCaseId:
      recoveryCase.id,

    eventType:
      "AI_STRATEGY_GENERATED",

    actorType:
      ActorType.AI,

    metadata: {
      strategyDecisionId:
        strategyDecision.id,

      decision:
        strategyDecision.decision,

      confidence:
        strategyDecision.confidence.toString(),

      riskLevel:
        strategyDecision.riskLevel,

      expectedRecovery:
        strategyDecision.expectedRecovery
          ?.toString() ?? null,

      reason:
        strategyDecision.reason,

      model:
        strategyDecision.model,

      promptVersion:
        strategyDecision.promptVersion,

      tool:
        strategyDecision.tool,
    },
  });

  return strategyDecision;
};