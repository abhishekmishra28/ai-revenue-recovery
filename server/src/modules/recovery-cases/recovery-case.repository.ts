import { prisma } from "../../lib/prisma";

export const findAllRecoveryCases = () => {
  return prisma.recoveryCase.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findRecoveryCaseById = (id: string) => {
  return prisma.recoveryCase.findUnique({
    where: {
      id,
    },
  });
};

export const createRecoveryCase = (data: {
  merchantId: string;
  customerId?: string;
  transactionId?: string;
  revenueEventId?: string;
  caseType:
    | "FAILED_PAYMENT"
    | "CHECKOUT_ABANDONMENT"
    | "SUBSCRIPTION_FAILURE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  currency: string;
  estimatedRecovery?: number;
}) => {
  return prisma.recoveryCase.create({
    data,
  });
};