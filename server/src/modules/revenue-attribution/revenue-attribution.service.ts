import {
  ActorType,
  AttributionType,
  OutcomeStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";

import {
  findAllRevenueAttributions,
  findRevenueAttributionById,
  findRevenueAttributionsByRecoveryCaseId,
  findRevenueAttributionsByOutcomeId,
} from "./revenue-attribution.repository";

import { createAuditEvent } from "../audit/audit.service";

type CreateRevenueAttributionInput = {
  outcomeId: string;
  amount: Prisma.Decimal;
  currency: string;
  attributionType: AttributionType;
};

export const getRevenueAttributions = () => {
  return findAllRevenueAttributions();
};

export const getRevenueAttribution = (
  id: string,
) => {
  return findRevenueAttributionById(id);
};

export const getRevenueAttributionsForRecoveryCase = (
  recoveryCaseId: string,
) => {
  return findRevenueAttributionsByRecoveryCaseId(
    recoveryCaseId,
  );
};

export const getRevenueAttributionsForOutcome = (
  outcomeId: string,
) => {
  return findRevenueAttributionsByOutcomeId(
    outcomeId,
  );
};

export const createRevenueAttribution = async (
  input: CreateRevenueAttributionInput,
) => {
  /*
   * 1. Find the outcome.
   */
  const outcome =
    await prisma.outcome.findUnique({
      where: {
        id: input.outcomeId,
      },
      include: {
        recoveryCase: true,
      },
    });

  if (!outcome) {
    throw new Error("Outcome not found");
  }

  /*
   * 2. Revenue can only be attributed
   *    to a successful outcome.
   */
  if (outcome.status !== OutcomeStatus.SUCCESS) {
    throw new Error(
      "Revenue can only be attributed to a successful outcome",
    );
  }

  /*
   * 3. Attribution amount must be positive.
   */
  if (input.amount.lessThanOrEqualTo(0)) {
    throw new Error(
      "Attribution amount must be greater than zero",
    );
  }

  /*
   * 4. Prevent duplicate attribution
   *    for the same outcome and attribution type.
   */
  const existingAttribution =
    await prisma.revenueAttribution.findFirst({
      where: {
        outcomeId: input.outcomeId,
        attributionType:
          input.attributionType,
      },
      orderBy: {
        attributedAt: "desc",
      },
    });

  if (existingAttribution) {
    return existingAttribution;
  }

  /*
   * 5. Attribution cannot exceed
   *    the recovered amount.
   */
  if (
    outcome.recoveredAmount &&
    input.amount.greaterThan(
      outcome.recoveredAmount,
    )
  ) {
    throw new Error(
      "Attribution amount cannot exceed recovered amount",
    );
  }

  /*
   * 6. Currency must match the outcome currency.
   */
  if (input.currency !== outcome.currency) {
    throw new Error(
      "Attribution currency must match outcome currency",
    );
  }

  /*
   * 7. Create Revenue Attribution.
   */
  const attribution =
    await prisma.revenueAttribution.create({
      data: {
        recoveryCaseId:
          outcome.recoveryCaseId,

        outcomeId:
          outcome.id,

        amount:
          input.amount,

        currency:
          input.currency,

        attributionType:
          input.attributionType,

        attributedAt:
          new Date(),
      },
    });

  /*
   * 8. Record audit event.
   */
  await createAuditEvent({
    merchantId:
      outcome.recoveryCase.merchantId,

    recoveryCaseId:
      outcome.recoveryCaseId,

    eventType:
      "REVENUE_ATTRIBUTED",

    actorType:
      ActorType.SYSTEM,

    metadata: {
      attributionId:
        attribution.id,

      outcomeId:
        outcome.id,

      amount:
        attribution.amount.toString(),

      currency:
        attribution.currency,

      attributionType:
        attribution.attributionType,
    },
  });

  return attribution;
};