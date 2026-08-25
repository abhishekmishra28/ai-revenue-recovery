import { Request, Response } from "express";

import { prisma } from "../../lib/prisma";
import { detectRecoveryCase } from "./recovery-engine.service";

type RevenueEventParams = {
  revenueEventId: string;
};

export const detectRecoveryCaseController = async (
  req: Request<RevenueEventParams>,
  res: Response
) => {
  try {
    const { revenueEventId } = req.params;

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
      },
    });

    if (!event) {
      res.status(404).json({
        error: "Revenue event not found",
      });

      return;
    }

    const recoveryCase = await detectRecoveryCase(event);

    if (!recoveryCase) {
      res.status(200).json({
        data: null,
        message: "No recovery case required for this event",
      });

      return;
    }

    res.status(200).json({
      data: recoveryCase,
    });
  } catch (error) {
    console.error(
      "Failed to detect recovery case:",
      error
    );

    res.status(500).json({
      error: "Failed to detect recovery case",
    });
  }
};