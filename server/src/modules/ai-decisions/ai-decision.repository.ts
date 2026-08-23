import { prisma } from "../../lib/prisma";

export const findAllAIDecisions = () => {
  return prisma.aIStrategyDecision.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findAIDecisionById = (id: string) => {
  return prisma.aIStrategyDecision.findUnique({
    where: {
      id,
    },
  });
};

export const findAIDecisionsByRecoveryCaseId = (
  recoveryCaseId: string
) => {
  return prisma.aIStrategyDecision.findMany({
    where: {
      recoveryCaseId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};