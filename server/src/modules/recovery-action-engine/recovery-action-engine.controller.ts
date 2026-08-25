import { Request, Response } from "express";

import {
  createRecoveryAction,
} from "./recovery-action-engine.service";

type StrategyDecisionParams = {
  strategyDecisionId: string;
};

export const createRecoveryActionController = async (
  req: Request<StrategyDecisionParams>,
  res: Response,
) => {
  try {
    const { strategyDecisionId } = req.params;

    const action = await createRecoveryAction(
      strategyDecisionId,
    );

    res.status(200).json({
      data: action,
    });
  } catch (error) {
    console.error(
      "Failed to create recovery action:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "AI strategy decision not found"
    ) {
      res.status(404).json({
        error: "AI strategy decision not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "cannot create a recovery action",
      )
    ) {
      res.status(409).json({
        error: error.message,
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "Unsupported recovery strategy",
      )
    ) {
      res.status(400).json({
        error: error.message,
      });

      return;
    }

    res.status(500).json({
      error: "Failed to create recovery action",
    });
  }
};