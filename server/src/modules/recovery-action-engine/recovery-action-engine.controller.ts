import { Request, Response } from "express";

import {
  createRecoveryAction,
  executeRecoveryAction,
} from "./recovery-action-engine.service";

type ActionParams = {
  recoveryActionId: string;
};

type StrategyDecisionParams = {
  strategyDecisionId: string;
};

export const createRecoveryActionController = async (
  req: Request<StrategyDecisionParams>,
  res: Response,
) => {
  try {
    const { strategyDecisionId } = req.params;

    const data = await createRecoveryAction(
      strategyDecisionId,
    );

    res.status(201).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to create recovery action:",
      error,
    );

    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create recovery action",
    });
  }
};

export const executeRecoveryActionController =
  async (
    req: Request<ActionParams>,
    res: Response,
  ) => {
    try {
      const { recoveryActionId } = req.params;

      const data = await executeRecoveryAction(
        recoveryActionId,
      );

      res.status(200).json({
        data,
      });
    } catch (error) {
      console.error(
        "Failed to execute recovery action:",
        error,
      );

      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute recovery action",
      });
    }
  };