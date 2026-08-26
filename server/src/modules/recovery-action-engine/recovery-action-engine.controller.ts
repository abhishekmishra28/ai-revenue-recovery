import { Request, Response } from "express";

import {
  createRecoveryAction,
} from "./recovery-action-engine.service";

type CreateRecoveryActionParams = {
  strategyDecisionId: string;
};

export const createRecoveryActionController =
  async (
    req: Request<CreateRecoveryActionParams>,
    res: Response,
  ) => {
    try {
      const {
        strategyDecisionId,
      } = req.params;

      if (!strategyDecisionId) {
        res.status(400).json({
          error:
            "strategyDecisionId is required",
        });

        return;
      }

      const data =
        await createRecoveryAction(
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