import {
  findAllOutcomes,
  findOutcomeById,
  findOutcomesByRecoveryCaseId,
  findOutcomeByRecoveryActionId,
} from "./outcome.repository";

import { prisma } from "../../lib/prisma";
import {
  ActorType,
  OutcomeStatus,
  Prisma,
} from "@prisma/client";

import { createAuditEvent } from "../audit/audit.service";

type CreateOutcomeInput = {
  recoveryActionId: string;
  status: OutcomeStatus;
  failureReason?: string;
  recoveredAmount?: Prisma.Decimal;
  currency: string;
};

export const getOutcomes = () => {
  return findAllOutcomes();
};

export const getOutcome = (id: string) => {
  return findOutcomeById(id);
};

export const getOutcomesForRecoveryCase = (
  recoveryCaseId: string,
) => {
  return findOutcomesByRecoveryCaseId(
    recoveryCaseId,
  );
};

export const getOutcomeForRecoveryAction = (
  recoveryActionId: string,
) => {
  return findOutcomeByRecoveryActionId(
    recoveryActionId,
  );
};

export const createOutcome = async (
  input: CreateOutcomeInput,
) => {
  /*
   * 1. Find the recovery action.
   */
  const recoveryAction =
    await prisma.recoveryAction.findUnique({
      where: {
        id: input.recoveryActionId,
      },
      include: {
        recoveryCase: true,
      },
    });

  if (!recoveryAction) {
    throw new Error(
      "Recovery action not found",
    );
  }

  /*
   * 2. Outcome can only be created after
   *    the recovery action has completed.
   */
  if (
    recoveryAction.status !==
      "SUCCEEDED" &&
    recoveryAction.status !==
      "FAILED"
  ) {
    throw new Error(
      "Recovery action must be completed before creating an outcome",
    );
  }

  /*
   * 3. Idempotency:
   *    One recovery action can have
   *    only one outcome.
   */
  const existingOutcome =
    await findOutcomeByRecoveryActionId(
      input.recoveryActionId,
    );

  if (existingOutcome) {
    return existingOutcome;
  }

  /*
   * 4. Create Outcome.
   */
  const outcome = await prisma.outcome.create({
    data: {
      recoveryCaseId:
        recoveryAction.recoveryCaseId,

      recoveryActionId:
        recoveryAction.id,

      status: input.status,

      failureReason:
        input.failureReason ?? null,

      recoveredAmount:
        input.recoveredAmount ?? null,

      currency: input.currency,

      occurredAt: new Date(),
    },
  });

  /*
   * 5. Audit Outcome creation.
   */
  await createAuditEvent({
    merchantId:
      recoveryAction.recoveryCase.merchantId,

    recoveryCaseId:
      recoveryAction.recoveryCaseId,

    eventType: "OUTCOME_CREATED",

    actorType: ActorType.SYSTEM,

    metadata: {
      outcomeId: outcome.id,

      recoveryActionId:
        recoveryAction.id,

      status: outcome.status,

      recoveredAmount:
        outcome.recoveredAmount?.toString() ??
        null,

      currency: outcome.currency,

      failureReason:
        outcome.failureReason,
    },
  });

  return outcome;
};