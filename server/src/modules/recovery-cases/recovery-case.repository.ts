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