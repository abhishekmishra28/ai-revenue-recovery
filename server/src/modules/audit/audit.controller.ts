import { Request, Response } from "express";
import {
  findAuditEventsByMerchantId,
  findAuditEventsByRecoveryCaseId,
} from "./audit.service";

type MerchantParams = {
  merchantId: string;
};

type RecoveryCaseParams = {
  recoveryCaseId: string;
};

export const getAuditEventsByMerchantController = async (
  req: Request<MerchantParams>,
  res: Response,
) => {
  try {
    const { merchantId } = req.params;

    const data = await findAuditEventsByMerchantId(
      merchantId,
    );

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch merchant audit events:",
      error,
    );

    res.status(500).json({
      error: "Failed to fetch audit events",
    });
  }
};

export const getAuditEventsByRecoveryCaseController =
  async (
    req: Request<RecoveryCaseParams>,
    res: Response,
  ) => {
    try {
      const { recoveryCaseId } = req.params;

      const data =
        await findAuditEventsByRecoveryCaseId(
          recoveryCaseId,
        );

      res.status(200).json({
        data,
      });
    } catch (error) {
      console.error(
        "Failed to fetch recovery case audit events:",
        error,
      );

      res.status(500).json({
        error: "Failed to fetch audit events",
      });
    }
  };