import { Router } from "express";
import {
  getTransactions,
  getTransaction,
  getCustomerTransactions,
  getMerchantTransactions,
} from "./transaction.controller";

const router = Router();

router.get("/", getTransactions);

router.get("/customer/:customerId", getCustomerTransactions);

router.get("/merchant/:merchantId", getMerchantTransactions);

router.get("/:id", getTransaction);

export default router;