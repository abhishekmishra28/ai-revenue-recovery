import { Request, Response } from "express";
import { executeRecoveryAction } from "./action-execution.service";

type ActionParams = {
  recoveryActionId: string;
};

export const executeRecoveryActionController = async (
  req: Request<ActionParams>,
  res: Response,
) => {
  try {
    const { recoveryActionId } = req.params;

    const action = await executeRecoveryAction(
      recoveryActionId,
    );

    res.status(200).json({
      data: action,
    });
  } catch (error) {
    console.error(
      "Failed to execute recovery action:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Recovery action not found"
    ) {
      res.status(404).json({
        error: "Recovery action not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "cannot be executed from status",
      )
    ) {
      res.status(409).json({
        error: error.message,
      });

      return;
    }

    res.status(500).json({
      error: "Failed to execute recovery action",
    });
  }
};