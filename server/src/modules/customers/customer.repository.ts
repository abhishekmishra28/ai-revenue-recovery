import { prisma } from "../../lib/prisma";

export const findAllCustomers = () => {
  return prisma.customer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findCustomerById = (id: string) => {
  return prisma.customer.findUnique({
    where: {
      id,
    },
  });
};

export const findCustomersByMerchantId = (merchantId: string) => {
  return prisma.customer.findMany({
    where: {
      merchantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};