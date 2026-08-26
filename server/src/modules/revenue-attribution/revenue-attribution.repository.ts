import { prisma } from "../../lib/prisma";

export const findAllRevenueAttributions = () => {
  return prisma.revenueAttribution.findMany({
    orderBy: {
      attributedAt: "desc",
    },
  });
};

export const findRevenueAttributionById = (
  id: string,
) => {
  return prisma.revenueAttribution.findUnique({
    where: {
      id,
    },
  });
};

export const findRevenueAttributionsByRecoveryCaseId = (
  recoveryCaseId: string,
) => {
  return prisma.revenueAttribution.findMany({
    where: {
      recoveryCaseId,
    },
    orderBy: {
      attributedAt: "desc",
    },
  });
};

export const findRevenueAttributionsByOutcomeId = (
  outcomeId: string,
) => {
  return prisma.revenueAttribution.findMany({
    where: {
      outcomeId,
    },
    orderBy: {
      attributedAt: "desc",
    },
  });
};