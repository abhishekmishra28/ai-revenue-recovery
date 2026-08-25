import { Router } from "express";

import {
  generateStrategyDecisionController,
} from "./ai-strategy-engine.controller";

const router = Router();

router.post(
  "/generate/:recoveryCaseId",
  generateStrategyDecisionController,
);

export default router;