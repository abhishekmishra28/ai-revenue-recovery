import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import {
  getOutcomes,
  getOutcome,
  getOutcomesForRecoveryCase,
  getOutcomeForRecoveryAction,
  createOutcome,
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
type CreateOutcomeBody = {
  recoveryActionId: string;
  status: string;
  failureReason?: string;
  recoveredAmount?: string;
  currency: string;
};

export const createOutcomeController = async (
  req: Request<{}, {}, CreateOutcomeBody>,
  res: Response,
) => {
  try {
    const {
      recoveryActionId,
      status,
      failureReason,
      recoveredAmount,
      currency,
    } = req.body;

    if (!recoveryActionId) {
      res.status(400).json({
        error: "recoveryActionId is required",
      });

      return;
    }

    if (!status) {
      res.status(400).json({
        error: "status is required",
      });

      return;
    }

    if (!currency) {
      res.status(400).json({
        error: "currency is required",
      });

      return;
    }

    const data = await createOutcome({
      recoveryActionId,
      status: status as any,
      failureReason,
      recoveredAmount:
        recoveredAmount !== undefined
          ? new Prisma.Decimal(recoveredAmount)
          : undefined,
      currency,
    });

    res.status(201).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to create outcome:",
      error,
    );

    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create outcome",
    });
  }
};