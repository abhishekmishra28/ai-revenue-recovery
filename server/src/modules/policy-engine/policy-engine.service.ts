import { prisma } from "../../lib/prisma";
import {
  ActorType,
  DecisionStatus,
  RecoveryActionStatus,
} from "@prisma/client";
import { createAuditEvent } from "../audit/audit.service";

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
   * Do not evaluate an already processed decision again.
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
   * No policy or disabled policy = reject.
   */
  if (!policy || !policy.enabled) {
    const rejectedDecision =
      await prisma.aIStrategyDecision.update({
        where: {
          id: decision.id,
        },
        data: {
          status: DecisionStatus.REJECTED,
        },
      });

    await createAuditEvent({
      merchantId: decision.recoveryCase.merchantId,
      recoveryCaseId: decision.recoveryCaseId,
      eventType: "AI_STRATEGY_REJECTED",
      actorType: ActorType.SYSTEM,
      metadata: {
        strategyDecisionId: decision.id,
        decision: decision.decision,
        reason: !policy
          ? "No merchant policy exists for this action"
          : "Merchant policy is disabled",
      },
    });

    return rejectedDecision;
  }

  /*
   * Maximum recovery amount check.
   */
  if (
    policy.maxAmount !== null &&
    decision.recoveryCase.estimatedRecovery !== null &&
    decision.recoveryCase.estimatedRecovery.gt(
      policy.maxAmount,
    )
  ) {
    const rejectedDecision =
      await prisma.aIStrategyDecision.update({
        where: {
          id: decision.id,
        },
        data: {
          status: DecisionStatus.REJECTED,
        },
      });

    await createAuditEvent({
      merchantId: decision.recoveryCase.merchantId,
      recoveryCaseId: decision.recoveryCaseId,
      eventType: "AI_STRATEGY_REJECTED",
      actorType: ActorType.SYSTEM,
      metadata: {
        strategyDecisionId: decision.id,
        decision: decision.decision,
        reason: "Estimated recovery exceeds merchant policy maximum",
        estimatedRecovery:
          decision.recoveryCase.estimatedRecovery.toString(),
        maxAmount: policy.maxAmount.toString(),
      },
    });

    return rejectedDecision;
  }

  /*
   * Maximum attempts check.
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
      const rejectedDecision =
        await prisma.aIStrategyDecision.update({
          where: {
            id: decision.id,
          },
          data: {
            status: DecisionStatus.REJECTED,
          },
        });

      await createAuditEvent({
        merchantId: decision.recoveryCase.merchantId,
        recoveryCaseId: decision.recoveryCaseId,
        eventType: "AI_STRATEGY_REJECTED",
        actorType: ActorType.SYSTEM,
        metadata: {
          strategyDecisionId: decision.id,
          decision: decision.decision,
          reason:
            "Maximum recovery attempts exceeded",
          attempts,
          maxAttempts: policy.maxAttempts,
        },
      });

      return rejectedDecision;
    }
  }

  /*
   * All policy checks passed.
   */
  const validatedDecision =
    await prisma.aIStrategyDecision.update({
      where: {
        id: decision.id,
      },
      data: {
        status: DecisionStatus.VALIDATED,
      },
    });

  await createAuditEvent({
    merchantId: decision.recoveryCase.merchantId,
    recoveryCaseId: decision.recoveryCaseId,
    eventType: "AI_STRATEGY_VALIDATED",
    actorType: ActorType.SYSTEM,
    metadata: {
      strategyDecisionId: decision.id,
      decision: decision.decision,
      estimatedRecovery:
        decision.recoveryCase.estimatedRecovery?.toString() ??
        null,
      policyId: policy.id,
      policyName: policy.name,
    },
  });

  return validatedDecision;
};