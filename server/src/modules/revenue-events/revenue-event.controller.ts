import { Request, Response } from "express";
import {
  getAllRevenueEvents,
  getRevenueEventById,
  getRevenueEventsByMerchantId,
  getRevenueEventsByCustomerId,
} from "./revenue-event.service";

export const getRevenueEvents = async (
  _req: Request,
  res: Response
) => {
  try {
    const events = await getAllRevenueEvents();

    res.status(200).json({
      data: events,
    });
  } catch (error) {
    console.error("Failed to fetch revenue events:", error);

    res.status(500).json({
      error: "Failed to fetch revenue events",
    });
  }
};

export const getRevenueEvent = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid revenue event ID",
      });
      return;
    }

    const event = await getRevenueEventById(id);

    if (!event) {
      res.status(404).json({
        error: "Revenue event not found",
      });
      return;
    }

    res.status(200).json({
      data: event,
    });
  } catch (error) {
    console.error("Failed to fetch revenue event:", error);

    res.status(500).json({
      error: "Failed to fetch revenue event",
    });
  }
};

export const getMerchantRevenueEvents = async (
  req: Request,
  res: Response
) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId || Array.isArray(merchantId)) {
      res.status(400).json({
        error: "Invalid merchant ID",
      });
      return;
    }

    const events = await getRevenueEventsByMerchantId(merchantId);

    res.status(200).json({
      data: events,
    });
  } catch (error) {
    console.error("Failed to fetch merchant revenue events:", error);

    res.status(500).json({
      error: "Failed to fetch merchant revenue events",
    });
  }
};

export const getCustomerRevenueEvents = async (
  req: Request,
  res: Response
) => {
  try {
    const { customerId } = req.params;

    if (!customerId || Array.isArray(customerId)) {
      res.status(400).json({
        error: "Invalid customer ID",
      });
      return;
    }

    const events = await getRevenueEventsByCustomerId(customerId);

    res.status(200).json({
      data: events,
    });
  } catch (error) {
    console.error("Failed to fetch customer revenue events:", error);

    res.status(500).json({
      error: "Failed to fetch customer revenue events",
    });
  }
};