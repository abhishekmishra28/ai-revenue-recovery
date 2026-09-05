import type { Request, Response } from "express";
import { getAllPolicies, getPoliciesByMerchant } from "./policies.service";

export const getAllPoliciesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const policies = await getAllPolicies();
    res.json({ data: policies });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch policies";
    res.status(500).json({ error: message });
  }
};

export const getPoliciesByMerchantController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const policies = await getPoliciesByMerchant(merchantId);
    res.json({ data: policies });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch policies";
    res.status(500).json({ error: message });
  }
};
