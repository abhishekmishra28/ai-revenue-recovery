import { prisma } from "../../lib/prisma";

export const findAllAuditEvents = () => {
  return prisma.auditEvent.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findAuditEventById = (id: string) => {
  return prisma.auditEvent.findUnique({
    where: {
      id,
    },
  });
};

export const findAuditEventsByMerchantId = (merchantId: string) => {
  return prisma.auditEvent.findMany({
    where: {
      merchantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findAuditEventsByRecoveryCaseId = (
  recoveryCaseId: string,
) => {
  return prisma.auditEvent.findMany({
    where: {
      recoveryCaseId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};