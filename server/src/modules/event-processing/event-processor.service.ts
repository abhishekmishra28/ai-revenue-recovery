import { prisma } from "../../lib/prisma";
import { detectRecoveryCase } from "../recovery-engine/recovery-engine.service";

export const processRevenueEvent = async (
  revenueEventId: string,
) => {
  const event = await prisma.revenueEvent.findUnique({
    where: {
      id: revenueEventId,
    },
    select: {
      id: true,
      merchantId: true,
      transactionId: true,
      customerId: true,
      eventType: true,
      processedAt: true,
    },
  });

  if (!event) {
    throw new Error("Revenue event not found");
  }

  // Idempotency:
  // already processed events should not create duplicate work.
  if (event.processedAt) {
    return {
      event,
      recoveryCase: null,
      status: "ALREADY_PROCESSED",
    };
  }

  const recoveryCase = await detectRecoveryCase(event);

  await prisma.revenueEvent.update({
    where: {
      id: event.id,
    },
    data: {
      processedAt: new Date(),
    },
  });

  return {
    event,
    recoveryCase,
    status: recoveryCase
      ? "RECOVERY_CASE_CREATED"
      : "NO_RECOVERY_REQUIRED",
  };
};