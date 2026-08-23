import { Request, Response } from "express";
import {
  findAllMerchants,
  findMerchantById,
} from "./merchant.repository";

export const getMerchants = async (
  _req: Request,
  res: Response
) => {
  try {
    const merchants = await findAllMerchants();

    res.status(200).json({
      data: merchants,
    });
  } catch (error) {
    console.error("Failed to fetch merchants:", error);

    res.status(500).json({
      error: "Failed to fetch merchants",
    });
  }
};

export const getMerchantById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      res.status(400).json({
        error: "Invalid merchant ID",
      });
      return;
    }

    const merchant = await findMerchantById(id);

    if (!merchant) {
      res.status(404).json({
        error: "Merchant not found",
      });
      return;
    }

    res.status(200).json({
      data: merchant,
    });
  } catch (error) {
    console.error("Failed to fetch merchant:", error);

    res.status(500).json({
      error: "Failed to fetch merchant",
    });
  }
};