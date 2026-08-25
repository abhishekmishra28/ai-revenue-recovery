import { Request, Response } from "express";
import { processRevenueEvent } from "./event-processor.service";

type RevenueEventParams = {
  revenueEventId: string;
};

export const processRevenueEventController = async (
  req: Request<RevenueEventParams>,
  res: Response,
) => {
  try {
    const { revenueEventId } = req.params;

    const result = await processRevenueEvent(
      revenueEventId,
    );

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to process revenue event:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Revenue event not found"
    ) {
      res.status(404).json({
        error: "Revenue event not found",
      });

      return;
    }

    res.status(500).json({
      error: "Failed to process revenue event",
    });
  }
};