import { Request, Response } from "express";
import {
  getRecoveryCases,
  getRecoveryCase,
} from "./recovery-case.service";

export const getRecoveryCasesController = async (
  _req: Request,
  res: Response
) => {
  try {
    const recoveryCases = await getRecoveryCases();

    res.status(200).json({
      data: recoveryCases,
    });
  } catch (error) {
    console.error("Failed to fetch recovery cases:", error);

    res.status(500).json({
      error: "Failed to fetch recovery cases",
    });
  }
};

export const getRecoveryCaseController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid recovery case ID",
      });
      return;
    }

    const recoveryCase = await getRecoveryCase(id);

    if (!recoveryCase) {
      res.status(404).json({
        error: "Recovery case not found",
      });
      return;
    }

    res.status(200).json({
      data: recoveryCase,
    });
  } catch (error) {
    console.error("Failed to fetch recovery case:", error);

    res.status(500).json({
      error: "Failed to fetch recovery case",
    });
  }
};