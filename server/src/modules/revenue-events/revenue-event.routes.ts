import { Router } from "express";
import {
  getRevenueEvents,
  getRevenueEvent,
  getMerchantRevenueEvents,
  getCustomerRevenueEvents,
} from "./revenue-event.controller";

const router = Router();

router.get("/", getRevenueEvents);

router.get("/merchant/:merchantId", getMerchantRevenueEvents);

router.get("/customer/:customerId", getCustomerRevenueEvents);

router.get("/:id", getRevenueEvent);

export default router;