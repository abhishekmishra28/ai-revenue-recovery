import { Request, Response } from "express";
import { validateStrategyDecision } from "./policy-engine.service";

type StrategyDecisionParams = {
  strategyDecisionId: string;
};

export const validateStrategyDecisionController = async (
  req: Request<StrategyDecisionParams>,
  res: Response,
) => {
  try {
    const { strategyDecisionId } = req.params;

    const decision = await validateStrategyDecision(
      strategyDecisionId,
    );

    res.status(200).json({
      data: decision,
    });
  } catch (error) {
    console.error(
      "Failed to validate AI strategy decision:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "AI strategy decision not found"
    ) {
      res.status(404).json({
        error: "AI strategy decision not found",
      });

      return;
    }

    res.status(500).json({
      error: "Failed to validate AI strategy decision",
    });
  }
};