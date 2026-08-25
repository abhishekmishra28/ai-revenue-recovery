import { prisma } from "../../lib/prisma";
import {
  RecoveryCaseType,
  RecoveryStrategy,
  RiskLevel,
  DecisionStatus,
} from "@prisma/client";

type StrategyDecisionResult = {
  decision: RecoveryStrategy;
  confidence: number;
  reason: string;
  riskLevel: RiskLevel;
};

const determineStrategy = (
  caseType: RecoveryCaseType,
  riskLevel: RiskLevel,
): StrategyDecisionResult => {
  switch (caseType) {
    case RecoveryCaseType.FAILED_PAYMENT:
      if (riskLevel === RiskLevel.HIGH) {
        return {
          decision: RecoveryStrategy.REQUEST_PAYMENT_METHOD_UPDATE,
          confidence: 0.88,
          reason:
            "High-risk failed payment should request a payment method update before attempting another charge.",
          riskLevel,
        };
      }

      return {
        decision: RecoveryStrategy.RETRY_PAYMENT,
        confidence: 0.91,
        reason:
          "The payment failed and the case is suitable for a payment retry.",
        riskLevel,
      };

    case RecoveryCaseType.CHECKOUT_ABANDONMENT:
      return {
        decision: RecoveryStrategy.SEND_CHECKOUT_REMINDER,
        confidence: 0.89,
        reason:
          "The customer abandoned checkout, so a checkout reminder is the most appropriate recovery action.",
        riskLevel,
      };

    case RecoveryCaseType.SUBSCRIPTION_FAILURE:
      return {
        decision: RecoveryStrategy.SEND_PAYMENT_REMINDER,
        confidence: 0.87,
        reason:
          "The subscription payment failed, so a payment reminder should be sent before further recovery actions.",
        riskLevel,
      };

    default:
      return {
        decision: RecoveryStrategy.NO_ACTION,
        confidence: 0.99,
        reason:
          "No supported recovery strategy was identified for this case.",
        riskLevel,
      };
  }
};

export const generateStrategyDecision = async (
  recoveryCaseId: string,
) => {
  const recoveryCase = await prisma.recoveryCase.findUnique({
    where: {
      id: recoveryCaseId,
    },
  });

  if (!recoveryCase) {
    throw new Error("Recovery case not found");
  }

  const existingDecision =
    await prisma.aIStrategyDecision.findFirst({
      where: {
        recoveryCaseId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (existingDecision) {
    return existingDecision;
  }

  const riskLevel =
    recoveryCase.riskLevel ?? RiskLevel.MEDIUM;

  const strategy = determineStrategy(
    recoveryCase.caseType,
    riskLevel,
  );

  const decision = await prisma.aIStrategyDecision.create({
    data: {
      recoveryCaseId: recoveryCase.id,

      decision: strategy.decision,

      confidence: strategy.confidence,

      reason: strategy.reason,

      evidence: {
        caseType: recoveryCase.caseType,
        priority: recoveryCase.priority,
        riskLevel,
        estimatedRecovery:
          recoveryCase.estimatedRecovery,
        currency: recoveryCase.currency,
      },

      expectedRecovery:
        recoveryCase.estimatedRecovery,

      riskLevel,

      tool: "deterministic-strategy-engine",

      parameters: {
        strategyVersion: "v1",
      },

      model: "rule-based-v1",

      promptVersion: "none",

      status: DecisionStatus.GENERATED,
    },
  });

  return decision;
};