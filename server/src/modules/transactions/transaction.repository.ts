import { prisma } from "../../lib/prisma";

export const findAllTransactions = () => {
  return prisma.transaction.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findTransactionById = (id: string) => {
  return prisma.transaction.findUnique({
    where: {
      id,
    },
  });
};

export const findTransactionsByCustomerId = (customerId: string) => {
  return prisma.transaction.findMany({
    where: {
      customerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findTransactionsByMerchantId = (merchantId: string) => {
  return prisma.transaction.findMany({
    where: {
      merchantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};