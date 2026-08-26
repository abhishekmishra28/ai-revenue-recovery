import { Request, Response } from "express";

import {
  orchestrateRecovery,
} from "./recovery-orchestrator.service";

type RevenueEventParams = {
  revenueEventId: string;
};

export const orchestrateRecoveryController =
  async (
    req: Request<RevenueEventParams>,
    res: Response,
  ) => {
    try {
      const {
        revenueEventId,
      } = req.params;

      if (!revenueEventId) {
        res.status(400).json({
          error:
            "revenueEventId is required",
        });

        return;
      }

      const data =
        await orchestrateRecovery(
          revenueEventId,
        );

      res.status(200).json({
        data,
      });
    } catch (error) {
      console.error(
        "Recovery orchestration failed:",
        error,
      );

      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Recovery orchestration failed",
      });
    }
  };