import { prisma } from "../../lib/prisma";
import {
  RevenueEventType,
  RecoveryCaseType,
  Priority,
  RiskLevel,
} from "@prisma/client";

type RecoveryEvent = {
  id: string;
  merchantId: string;
  transactionId: string | null;
  customerId: string | null;
  eventType: RevenueEventType;
};

const getCaseType = (
  eventType: RevenueEventType
): RecoveryCaseType | null => {
  switch (eventType) {
    case RevenueEventType.PAYMENT_FAILED:
      return RecoveryCaseType.FAILED_PAYMENT;

    case RevenueEventType.CHECKOUT_ABANDONED:
      return RecoveryCaseType.CHECKOUT_ABANDONMENT;

    case RevenueEventType.SUBSCRIPTION_PAYMENT_FAILED:
      return RecoveryCaseType.SUBSCRIPTION_FAILURE;

    default:
      return null;
  }
};

const getPriority = (
  amount: number | undefined
): Priority => {
  if (amount === undefined) {
    return Priority.MEDIUM;
  }

  if (amount >= 50000) {
    return Priority.CRITICAL;
  }

  if (amount >= 10000) {
    return Priority.HIGH;
  }

  if (amount >= 1000) {
    return Priority.MEDIUM;
  }

  return Priority.LOW;
};

const getRiskLevel = (
  amount: number | undefined
): RiskLevel => {
  if (amount === undefined) {
    return RiskLevel.MEDIUM;
  }

  if (amount >= 50000) {
    return RiskLevel.HIGH;
  }

  if (amount >= 10000) {
    return RiskLevel.MEDIUM;
  }

  return RiskLevel.LOW;
};

const getTransaction = async (
  transactionId: string | null | undefined
) => {
  if (!transactionId) {
    return null;
  }

  return prisma.transaction.findUnique({
    where: {
      id: transactionId,
    },
    select: {
      amount: true,
      currency: true,
    },
  });
};

export const detectRecoveryCase = async (
  event: RecoveryEvent
) => {
  const caseType = getCaseType(event.eventType);

  // Event does not represent a recoverable revenue situation.
  if (!caseType) {
    return null;
  }

  // Prevent duplicate recovery cases for the same revenue event.
  const existingCase = await prisma.recoveryCase.findFirst({
    where: {
      revenueEventId: event.id,
    },
  });

  if (existingCase) {
    return existingCase;
  }

  const transaction = await getTransaction(
    event.transactionId
  );

  const amount = transaction
    ? Number(transaction.amount)
    : undefined;

  const currency =
    transaction?.currency ?? "INR";

  const priority = getPriority(amount);
  const riskLevel = getRiskLevel(amount);

  return prisma.recoveryCase.create({
    data: {
      merchantId: event.merchantId,
      customerId: event.customerId,
      transactionId: event.transactionId,
      revenueEventId: event.id,
      caseType,
      status: "OPEN",
      priority,
      riskLevel,
      estimatedRecovery: amount,
      currency,
    },
  });
};