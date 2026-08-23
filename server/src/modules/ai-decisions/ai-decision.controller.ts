import { Request, Response } from "express";

import {
  findAllAIDecisions,
  findAIDecisionById,
  findAIDecisionsByRecoveryCaseId,
} from "./ai-decision.repository";

type AIDecisionParams = {
  id: string;
};

type RecoveryCaseParams = {
  recoveryCaseId: string;
};

export const getAIDecisionsController = async (
  _req: Request,
  res: Response
) => {
  try {
    const data = await findAllAIDecisions();

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch AI decisions:", error);

    res.status(500).json({
      error: "Failed to fetch AI decisions",
    });
  }
};

export const getAIDecisionByIdController = async (
  req: Request<AIDecisionParams>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const data = await findAIDecisionById(id);

    if (!data) {
      res.status(404).json({
        error: "AI decision not found",
      });

      return;
    }

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch AI decision:", error);

    res.status(500).json({
      error: "Failed to fetch AI decision",
    });
  }
};

export const getAIDecisionsForRecoveryCaseController = async (
  req: Request<RecoveryCaseParams>,
  res: Response
) => {
  try {
    const { recoveryCaseId } = req.params;

    const data = await findAIDecisionsByRecoveryCaseId(
      recoveryCaseId
    );

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch AI decisions for recovery case:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch AI decisions",
    });
  }
};