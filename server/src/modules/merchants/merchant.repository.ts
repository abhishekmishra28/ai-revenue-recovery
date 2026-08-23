import { prisma } from "../../lib/prisma";

export const findAllMerchants = () => {
  return prisma.merchant.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findMerchantById = (id: string) => {
  return prisma.merchant.findUnique({
    where: { id },
  });
};