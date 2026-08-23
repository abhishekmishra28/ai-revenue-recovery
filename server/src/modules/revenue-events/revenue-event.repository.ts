import { prisma } from "../../lib/prisma";

export const findAllRevenueEvents = () => {
  return prisma.revenueEvent.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findRevenueEventById = (id: string) => {
  return prisma.revenueEvent.findUnique({
    where: {
      id,
    },
  });
};

export const findRevenueEventsByMerchantId = (merchantId: string) => {
  return prisma.revenueEvent.findMany({
    where: {
      merchantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findRevenueEventsByCustomerId = (customerId: string) => {
  return prisma.revenueEvent.findMany({
    where: {
      customerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};