import { Router } from "express";
import {
  getCustomers,
  getCustomerByIdController,
  getCustomersByMerchant,
} from "./customer.controller";

const router = Router();

router.get("/", getCustomers);

router.get("/merchant/:merchantId", getCustomersByMerchant);

router.get("/:id", getCustomerByIdController);

export default router;