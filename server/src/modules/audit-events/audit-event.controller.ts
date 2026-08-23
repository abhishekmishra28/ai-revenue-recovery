import { Request, Response } from "express";

import {
  getAuditEvents,
  getAuditEvent,
  getAuditEventsForMerchant,
  getAuditEventsForRecoveryCase,
} from "./audit-event.service";

type IdParams = {
  id: string;
};

type MerchantParams = {
  merchantId: string;
};

type RecoveryCaseParams = {
  recoveryCaseId: string;
};

export const getAuditEventsController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const data = await getAuditEvents();

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch audit events:", error);

    res.status(500).json({
      error: "Failed to fetch audit events",
    });
  }
};

export const getAuditEventByIdController = async (
  req: Request<IdParams>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const data = await getAuditEvent(id);

    if (!data) {
      res.status(404).json({
        error: "Audit event not found",
      });

      return;
    }

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Failed to fetch audit event:", error);

    res.status(500).json({
      error: "Failed to fetch audit event",
    });
  }
};

export const getAuditEventsForMerchantController = async (
  req: Request<MerchantParams>,
  res: Response,
) => {
  try {
    const { merchantId } = req.params;

    const data = await getAuditEventsForMerchant(merchantId);

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch audit events for merchant:",
      error,
    );

    res.status(500).json({
      error: "Failed to fetch audit events",
    });
  }
};

export const getAuditEventsForRecoveryCaseController = async (
  req: Request<RecoveryCaseParams>,
  res: Response,
) => {
  try {
    const { recoveryCaseId } = req.params;

    const data =
      await getAuditEventsForRecoveryCase(recoveryCaseId);

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch audit events for recovery case:",
      error,
    );

    res.status(500).json({
      error: "Failed to fetch audit events",
    });
  }
};