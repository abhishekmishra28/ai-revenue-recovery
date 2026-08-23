import { Request, Response } from "express";

import {
  getOutcomes,
  getOutcome,
  getOutcomesForRecoveryCase,
  getOutcomeForRecoveryAction,
} from "./outcome.service";

type OutcomeParams = {
  id: string;
};

type RecoveryCaseParams = {
  recoveryCaseId: string;
};

type RecoveryActionParams = {
  recoveryActionId: string;
};

export const getOutcomesController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const data = await getOutcomes();

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch outcomes:", error);

    res.status(500).json({
      error: "Failed to fetch outcomes",
    });
  }
};

export const getOutcomeByIdController = async (
  req: Request<OutcomeParams>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const data = await getOutcome(id);

    if (!data) {
      res.status(404).json({
        error: "Outcome not found",
      });

      return;
    }

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch outcome:", error);

    res.status(500).json({
      error: "Failed to fetch outcome",
    });
  }
};

export const getOutcomesForRecoveryCaseController = async (
  req: Request<RecoveryCaseParams>,
  res: Response,
) => {
  try {
    const { recoveryCaseId } = req.params;

    const data = await getOutcomesForRecoveryCase(
      recoveryCaseId,
    );

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch outcomes for recovery case:",
      error,
    );

    res.status(500).json({
      error: "Failed to fetch outcomes",
    });
  }
};

export const getOutcomeForRecoveryActionController = async (
  req: Request<RecoveryActionParams>,
  res: Response,
) => {
  try {
    const { recoveryActionId } = req.params;

    const data = await getOutcomeForRecoveryAction(
      recoveryActionId,
    );

    if (!data) {
      res.status(404).json({
        error: "Outcome not found for recovery action",
      });

      return;
    }

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch outcome for recovery action:",
      error,
    );

    res.status(500).json({
      error: "Failed to fetch outcome",
    });
  }
};