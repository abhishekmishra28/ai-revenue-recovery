import { prisma } from "../../lib/prisma";

import {
  RecoveryActionStatus,
  RecoveryActionType,
  DecisionStatus,
  ActorType,
} from "@prisma/client";

import { createAuditEvent } from "../audit/audit.service";

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
   * ============================================================
   * STEP 1
   * Load strategy decision + recovery case.
   * ============================================================
   */

  const decision =
    await prisma.aIStrategyDecision.findUnique({
      where: {
        id: strategyDecisionId,
      },
      include: {
        recoveryCase: true,
      },
    });

  if (!decision) {
    throw new Error(
      "AI strategy decision not found",
    );
  }

  /*
   * ============================================================
   * STEP 2
   * Only VALIDATED decisions may create actions.
   *
   * This is a hard safety boundary.
   * ============================================================
   */

  if (
    decision.status !==
    DecisionStatus.VALIDATED
  ) {
    throw new Error(
      `AI strategy decision must be VALIDATED before creating a recovery action. Current status: ${decision.status}`,
    );
  }

  /*
   * ============================================================
   * STEP 3
   * Idempotency.
   *
   * One strategy decision must produce at most one
   * RecoveryAction.
   * ============================================================
   */

  const existingAction =
    await prisma.recoveryAction.findFirst({
      where: {
        strategyDecisionId:
          decision.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (existingAction) {
    return existingAction;
  }

  /*
   * ============================================================
   * STEP 4
   * Convert AI strategy into executable action.
   * ============================================================
   */

  const actionType =
    mapStrategyToAction(
      decision.decision,
    );

  /*
   * ============================================================
   * STEP 5
   * Deterministic idempotency key.
   * ============================================================
   */

  const idempotencyKey =
    `strategy-decision:${decision.id}`;

  /*
   * ============================================================
   * STEP 6
   * Create RecoveryAction.
   * ============================================================
   */

  const action =
    await prisma.recoveryAction.create({
      data: {
        recoveryCaseId:
          decision.recoveryCaseId,

        strategyDecisionId:
          decision.id,

        actionType,

        status:
          RecoveryActionStatus.PENDING,

        idempotencyKey,

        parameters:
          decision.parameters ??
          undefined,
      },

      include: {
        recoveryCase: true,
        strategyDecision: true,
      },
    });

  /*
   * ============================================================
   * STEP 7
   * Audit the action creation.
   * ============================================================
   */

  await createAuditEvent({
    merchantId:
      decision.recoveryCase.merchantId,

    recoveryCaseId:
      decision.recoveryCaseId,

    eventType:
      "RECOVERY_ACTION_CREATED",

    actorType:
      ActorType.SYSTEM,

    metadata: {
      recoveryActionId:
        action.id,

      strategyDecisionId:
        decision.id,

      actionType:
        action.actionType,

      status:
        action.status,

      idempotencyKey:
        action.idempotencyKey,
    },
  });

  /*
   * ============================================================
   * STEP 8
   * Return created action.
   * ============================================================
   */

  return action;
};