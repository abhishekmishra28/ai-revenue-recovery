import { Router } from "express";

import {
  createRevenueAttributionController,
} from "./revenue-attribution.controller";

const router = Router();

router.post(
  "/create/:outcomeId",
  createRevenueAttributionController,
);

export default router;