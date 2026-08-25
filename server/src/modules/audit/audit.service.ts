import { prisma } from "../../lib/prisma";
import {
  ActorType,
  Prisma,
} from "@prisma/client";

type CreateAuditEventInput = {
  merchantId: string;
  recoveryCaseId?: string;
  eventType: string;
  actorType: ActorType;
  actorId?: string;
  metadata?: Prisma.InputJsonValue;
};

export const createAuditEvent = async (
  input: CreateAuditEventInput,
) => {
  const auditEvent = await prisma.auditEvent.create({
    data: {
      merchantId: input.merchantId,

      recoveryCaseId:
        input.recoveryCaseId ?? undefined,

      eventType: input.eventType,

      actorType: input.actorType,

      actorId: input.actorId ?? undefined,

      metadata: input.metadata ?? {},
    },
  });

  return auditEvent;
};

export const findAuditEventsByMerchantId = async (
  merchantId: string,
) => {
  return prisma.auditEvent.findMany({
    where: {
      merchantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findAuditEventsByRecoveryCaseId = async (
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