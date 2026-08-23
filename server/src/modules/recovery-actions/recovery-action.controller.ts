import { Request, Response } from "express";

import {
  getRecoveryActions,
  getRecoveryAction,
  getRecoveryActionsForRecoveryCase,
} from "./recovery-action.service";

type RecoveryActionParams = {
  id: string;
};

type RecoveryCaseParams = {
  recoveryCaseId: string;
};

export const getRecoveryActionsController = async (
  _req: Request,
  res: Response
) => {
  try {
    const data = await getRecoveryActions();

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch recovery actions:", error);

    res.status(500).json({
      error: "Failed to fetch recovery actions",
    });
  }
};

export const getRecoveryActionByIdController = async (
  req: Request<RecoveryActionParams>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const data = await getRecoveryAction(id);

    if (!data) {
      res.status(404).json({
        error: "Recovery action not found",
      });

      return;
    }

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch recovery action:", error);

    res.status(500).json({
      error: "Failed to fetch recovery action",
    });
  }
};

export const getRecoveryActionsForRecoveryCaseController = async (
  req: Request<RecoveryCaseParams>,
  res: Response
) => {
  try {
    const { recoveryCaseId } = req.params;

    const data =
      await getRecoveryActionsForRecoveryCase(recoveryCaseId);

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch recovery actions for recovery case:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch recovery actions",
    });
  }
};