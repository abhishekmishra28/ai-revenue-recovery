import { prisma } from "../../lib/prisma";

export const findAllRecoveryActions = () => {
  return prisma.recoveryAction.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findRecoveryActionById = (id: string) => {
  return prisma.recoveryAction.findUnique({
    where: {
      id,
    },
  });
};

export const findRecoveryActionsByRecoveryCaseId = (
  recoveryCaseId: string
) => {
  return prisma.recoveryAction.findMany({
    where: {
      recoveryCaseId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};