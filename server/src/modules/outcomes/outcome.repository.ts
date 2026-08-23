import { prisma } from "../../lib/prisma";

export const findAllOutcomes = () => {
  return prisma.outcome.findMany({
    orderBy: {
      occurredAt: "desc",
    },
  });
};

export const findOutcomeById = (id: string) => {
  return prisma.outcome.findUnique({
    where: {
      id,
    },
  });
};

export const findOutcomesByRecoveryCaseId = (
  recoveryCaseId: string,
) => {
  return prisma.outcome.findMany({
    where: {
      recoveryCaseId,
    },
    orderBy: {
      occurredAt: "desc",
    },
  });
};

export const findOutcomeByRecoveryActionId = (
  recoveryActionId: string,
) => {
  return prisma.outcome.findUnique({
    where: {
      recoveryActionId,
    },
  });
};