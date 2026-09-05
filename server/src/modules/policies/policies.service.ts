import { prisma } from "../../lib/prisma";

export const getPoliciesByMerchant = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    throw new Error(`Merchant not found: ${merchantId}`);
  }

  const policies = await prisma.policy.findMany({
    where: { merchantId },
    orderBy: { actionType: "asc" },
  });

  return policies;
};

export const getAllPolicies = async () => {
  const policies = await prisma.policy.findMany({
    include: {
      merchant: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ merchantId: "asc" }, { actionType: "asc" }],
  });

  return policies;
};
