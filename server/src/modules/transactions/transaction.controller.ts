import { Request, Response } from "express";
import {
  getAllTransactions,
  getTransactionById,
  getTransactionsByCustomerId,
  getTransactionsByMerchantId,
} from "./transaction.service";

export const getTransactions = async (
  _req: Request,
  res: Response
) => {
  try {
    const transactions = await getAllTransactions();

    res.status(200).json({
      data: transactions,
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);

    res.status(500).json({
      error: "Failed to fetch transactions",
    });
  }
};

export const getTransaction = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid transaction ID",
      });
      return;
    }

    const transaction = await getTransactionById(id);

    if (!transaction) {
      res.status(404).json({
        error: "Transaction not found",
      });
      return;
    }

    res.status(200).json({
      data: transaction,
    });
  } catch (error) {
    console.error("Failed to fetch transaction:", error);

    res.status(500).json({
      error: "Failed to fetch transaction",
    });
  }
};

export const getCustomerTransactions = async (
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

    const transactions =
      await getTransactionsByCustomerId(customerId);

    res.status(200).json({
      data: transactions,
    });
  } catch (error) {
    console.error(
      "Failed to fetch customer transactions:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch customer transactions",
    });
  }
};

export const getMerchantTransactions = async (
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

    const transactions =
      await getTransactionsByMerchantId(merchantId);

    res.status(200).json({
      data: transactions,
    });
  } catch (error) {
    console.error(
      "Failed to fetch merchant transactions:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch merchant transactions",
    });
  }
};