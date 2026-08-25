import { prisma } from "../../lib/prisma";
import { ActorType, RecoveryStrategy, RiskLevel } from "@prisma/client";
import { createAuditEvent } from "../audit/audit.service";

export const generateStrategyDecision = async (
  recoveryCaseId: string,
) => {
  const recoveryCase = await prisma.recoveryCase.findUnique({
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
    throw new Error("Recovery case not found");
  }

  /*
   * Basic rule-based strategy selection.
   *
   * This is intentionally deterministic for the current
   * recovery engine. The model field allows us to replace
   * this with an actual AI model later.
   */
  let decision: RecoveryStrategy;
  let reason: string;
  let riskLevel: RiskLevel;
  let confidence: number;

  switch (recoveryCase.caseType) {
    case "FAILED_PAYMENT":
      decision = RecoveryStrategy.RETRY_PAYMENT;
      reason =
        "Payment failure detected. Retrying the payment is the primary recovery strategy.";
      riskLevel = RiskLevel.MEDIUM;
      confidence = 0.9;
      break;

    case "CHECKOUT_ABANDONMENT":
      decision = RecoveryStrategy.SEND_CHECKOUT_REMINDER;
      reason =
        "Checkout was abandoned. A checkout reminder can encourage the customer to complete the payment.";
      riskLevel = RiskLevel.LOW;
      confidence = 0.86;
      break;

    case "SUBSCRIPTION_FAILURE":
      decision =
        RecoveryStrategy.REQUEST_PAYMENT_METHOD_UPDATE;
      reason =
        "Subscription payment failed. Requesting a payment method update is appropriate for recurring payment recovery.";
      riskLevel = RiskLevel.MEDIUM;
      confidence = 0.88;
      break;

    default:
      decision = RecoveryStrategy.NO_ACTION;
      reason =
        "No suitable recovery strategy was identified.";
      riskLevel = RiskLevel.LOW;
      confidence = 0.5;
  }

  /*
   * Estimate recoverable revenue.
   */
  const expectedRecovery =
    recoveryCase.estimatedRecovery ?? null;

  /*
   * Create the AI strategy decision.
   */
  const strategyDecision =
    await prisma.aIStrategyDecision.create({
      data: {
        recoveryCaseId: recoveryCase.id,

        decision,

        confidence,

        reason,

        evidence: {
          caseType: recoveryCase.caseType,
          priority: recoveryCase.priority,
          riskLevel,
          transactionStatus:
            recoveryCase.transaction?.status ?? null,
          paymentMethod:
            recoveryCase.transaction?.paymentMethod ?? null,
          failureCode:
            recoveryCase.transaction?.failureCode ?? null,
        },

        expectedRecovery,

        riskLevel,

        tool: "rule-based-recovery-engine",

        parameters: {
          recoveryCaseId: recoveryCase.id,
        },

        model: "recovery-rule-engine",

        promptVersion: "v1",

        status: "GENERATED",
      },
    });

  /*
   * Record the AI decision in the audit trail.
   */
  await createAuditEvent({
    merchantId: recoveryCase.merchantId,

    recoveryCaseId: recoveryCase.id,

    eventType: "AI_STRATEGY_GENERATED",

    actorType: ActorType.AI,

    metadata: {
      strategyDecisionId: strategyDecision.id,
      decision: strategyDecision.decision,
      confidence:
        strategyDecision.confidence.toString(),
      riskLevel: strategyDecision.riskLevel,
      expectedRecovery:
        strategyDecision.expectedRecovery?.toString() ??
        null,
      reason: strategyDecision.reason,
      model: strategyDecision.model,
      promptVersion: strategyDecision.promptVersion,
    },
  });

  return strategyDecision;
};