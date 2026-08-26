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

  /*
   * Idempotency:
   * If the event has already completed processing,
   * do not create duplicate recovery work.
   */
  if (event.processedAt) {
    return {
      event,
      recoveryCase: null,
      status: "ALREADY_PROCESSED" as const,
    };
  }

  /*
   * Detect whether this event requires recovery.
   */
  const recoveryCase = await detectRecoveryCase(event);

  /*
   * Mark the event as processed only after
   * recovery-case detection succeeds.
   *
   * The downstream orchestrator is now responsible
   * for completing the recovery pipeline.
   */
  await prisma.revenueEvent.update({
    where: {
      id: event.id,
    },
    data: {
      processedAt: new Date(),
    },
  });

  return {
    event: {
      ...event,
      processedAt: new Date(),
    },
    recoveryCase,
    status: recoveryCase
      ? ("RECOVERY_CASE_CREATED" as const)
      : ("NO_RECOVERY_REQUIRED" as const),
  };
};