import { Request, Response } from "express";
import { generateStrategyDecision } from "./ai-strategy-engine.service";

type RecoveryCaseParams = {
  recoveryCaseId: string;
};

export const generateStrategyDecisionController = async (
  req: Request<RecoveryCaseParams>,
  res: Response,
) => {
  try {
    const { recoveryCaseId } = req.params;

    const decision = await generateStrategyDecision(
      recoveryCaseId,
    );

    res.status(200).json({
      data: decision,
    });
  } catch (error) {
    console.error(
      "Failed to generate AI strategy decision:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Recovery case not found"
    ) {
      res.status(404).json({
        error: "Recovery case not found",
      });

      return;
    }

    res.status(500).json({
      error: "Failed to generate AI strategy decision",
    });
  }
};