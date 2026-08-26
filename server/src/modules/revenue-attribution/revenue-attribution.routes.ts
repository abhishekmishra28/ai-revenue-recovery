import { Router } from "express";

import {
  getRevenueAttributionsController,
  getRevenueAttributionByIdController,
  getRevenueAttributionsForRecoveryCaseController,
  getRevenueAttributionsForOutcomeController,
  createRevenueAttributionController,
} from "./revenue-attribution.controller";

const router = Router();

router.get(
  "/",
  getRevenueAttributionsController,
);

router.post(
  "/",
  createRevenueAttributionController,
);

router.get(
  "/recovery-case/:recoveryCaseId",
  getRevenueAttributionsForRecoveryCaseController,
);

router.get(
  "/outcome/:outcomeId",
  getRevenueAttributionsForOutcomeController,
);

router.get(
  "/:id",
  getRevenueAttributionByIdController,
);

export default router;