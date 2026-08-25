import { Request, Response } from "express";
import { createRevenueAttribution } from "./revenue-attribution.service";

type OutcomeParams = {
  outcomeId: string;
};

export const createRevenueAttributionController = async (
  req: Request<OutcomeParams>,
  res: Response,
) => {
  try {
    const { outcomeId } = req.params;

    const attribution = await createRevenueAttribution(
      outcomeId,
    );

    res.status(201).json({
      data: attribution,
    });
  } catch (error) {
    console.error(
      "Failed to create revenue attribution:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Outcome not found"
    ) {
      res.status(404).json({
        error: "Outcome not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      (
        error.message.includes(
          "only be attributed to a successful outcome",
        ) ||
        error.message.includes(
          "does not contain a recovered amount",
        )
      )
    ) {
      res.status(409).json({
        error: error.message,
      });

      return;
    }

    res.status(500).json({
      error: "Failed to create revenue attribution",
    });
  }
};