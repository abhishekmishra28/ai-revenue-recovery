import { Request, Response } from "express";
import {
  getAllCustomers,
  getCustomerById,
  getCustomersByMerchantId,
} from "./customer.service";

export const getCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await getAllCustomers();

    res.status(200).json({
      data: customers,
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);

    res.status(500).json({
      error: "Failed to fetch customers",
    });
  }
};

export const getCustomerByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid customer ID",
      });
      return;
    }

    const customer = await getCustomerById(id);

    if (!customer) {
      res.status(404).json({
        error: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      data: customer,
    });
  } catch (error) {
    console.error("Failed to fetch customer:", error);

    res.status(500).json({
      error: "Failed to fetch customer",
    });
  }
};

export const getCustomersByMerchant = async (
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

    const customers = await getCustomersByMerchantId(merchantId);

    res.status(200).json({
      data: customers,
    });
  } catch (error) {
    console.error("Failed to fetch merchant customers:", error);

    res.status(500).json({
      error: "Failed to fetch merchant customers",
    });
  }
};