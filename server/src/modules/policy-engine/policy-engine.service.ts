import { prisma } from "../../lib/prisma";
import {
  DecisionStatus,
  RecoveryActionStatus,
} from "@prisma/client";

export const validateStrategyDecision = async (
  strategyDecisionId: string,
) => {
  const decision = await prisma.aIStrategyDecision.findUnique({
    where: {
      id: strategyDecisionId,
    },
    include: {
      recoveryCase: true,
    },
  });

  if (!decision) {
    throw new Error("AI strategy decision not found");
  }

  /*
   * Idempotency:
   * A decision that has already been validated/rejected
   * should not be evaluated again.
   */
  if (
    decision.status === DecisionStatus.VALIDATED ||
    decision.status === DecisionStatus.REJECTED
  ) {
    return decision;
  }

  const policy = await prisma.policy.findUnique({
    where: {
      merchantId_actionType: {
        merchantId: decision.recoveryCase.merchantId,
        actionType: decision.decision,
      },
    },
  });

  /*
   * No policy means the action is not explicitly allowed.
   */
  if (!policy || !policy.enabled) {
    return prisma.aIStrategyDecision.update({
      where: {
        id: decision.id,
      },
      data: {
        status: DecisionStatus.REJECTED,
      },
    });
  }

  /*
   * Check maximum recovery amount.
   */
  if (
    policy.maxAmount !== null &&
    decision.recoveryCase.estimatedRecovery !== null &&
    decision.recoveryCase.estimatedRecovery.gt(policy.maxAmount)
  ) {
    return prisma.aIStrategyDecision.update({
      where: {
        id: decision.id,
      },
      data: {
        status: DecisionStatus.REJECTED,
      },
    });
  }

  /*
   * Check maximum attempts.
   */
  if (policy.maxAttempts !== null) {
    const attempts = await prisma.recoveryAction.count({
      where: {
        recoveryCaseId: decision.recoveryCaseId,
        status: {
          in: [
            RecoveryActionStatus.PENDING,
            RecoveryActionStatus.VALIDATED,
            RecoveryActionStatus.EXECUTING,
            RecoveryActionStatus.SUCCEEDED,
            RecoveryActionStatus.FAILED,
          ],
        },
      },
    });

    if (attempts >= policy.maxAttempts) {
      return prisma.aIStrategyDecision.update({
        where: {
          id: decision.id,
        },
        data: {
          status: DecisionStatus.REJECTED,
        },
      });
    }
  }

  /*
   * All policy checks passed.
   */
  return prisma.aIStrategyDecision.update({
    where: {
      id: decision.id,
    },
    data: {
      status: DecisionStatus.VALIDATED,
    },
  });
};