import { prisma } from "../../lib/prisma";
import {
  RecoveryActionStatus,
  RecoveryActionType,
  DecisionStatus,
} from "@prisma/client";

const mapStrategyToAction = (
  decision: string,
): RecoveryActionType => {
  switch (decision) {
    case "RETRY_PAYMENT":
      return RecoveryActionType.RETRY_PAYMENT;

    case "SEND_PAYMENT_REMINDER":
      return RecoveryActionType.SEND_PAYMENT_REMINDER;

    case "REQUEST_PAYMENT_METHOD_UPDATE":
      return RecoveryActionType.REQUEST_PAYMENT_METHOD_UPDATE;

    case "SEND_CHECKOUT_REMINDER":
      return RecoveryActionType.SEND_CHECKOUT_REMINDER;

    case "OFFER_RECOVERY_INCENTIVE":
      return RecoveryActionType.OFFER_RECOVERY_INCENTIVE;

    case "NO_ACTION":
      return RecoveryActionType.NO_ACTION;

    default:
      throw new Error(
        `Unsupported recovery strategy: ${decision}`,
      );
  }
};

export const createRecoveryAction = async (
  strategyDecisionId: string,
) => {
  /*
   * 1. Find the AI strategy decision
   */
  const decision =
    await prisma.aIStrategyDecision.findUnique({
      where: {
        id: strategyDecisionId,
      },
    });

  if (!decision) {
    throw new Error("AI strategy decision not found");
  }

  /*
   * 2. Only validated/generated decisions
   *    can produce recovery actions.
   */
  if (
    decision.status !== DecisionStatus.GENERATED &&
    decision.status !== DecisionStatus.VALIDATED
  ) {
    throw new Error(
      "AI strategy decision cannot create a recovery action",
    );
  }

  /*
   * 3. Check whether an action already exists.
   *
   * This makes the operation idempotent.
   */
  const existingAction =
    await prisma.recoveryAction.findFirst({
      where: {
        strategyDecisionId: decision.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (existingAction) {
    return existingAction;
  }

  /*
   * 4. Convert AI strategy into executable action.
   */
  const actionType = mapStrategyToAction(
    decision.decision,
  );

  /*
   * 5. Generate deterministic idempotency key.
   */
  const idempotencyKey =
    `strategy-decision:${decision.id}`;

  /*
   * 6. Create RecoveryAction.
   */
  const action = await prisma.recoveryAction.create({
    data: {
      recoveryCaseId: decision.recoveryCaseId,

      strategyDecisionId: decision.id,

      actionType,

      status: RecoveryActionStatus.PENDING,

      idempotencyKey,

      parameters: decision.parameters ?? undefined,
    },
  });

  return action;
};