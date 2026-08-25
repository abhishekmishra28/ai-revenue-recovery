import { Router } from "express";

import {
  validateStrategyDecisionController,
} from "./policy-engine.controller";

const router = Router();

router.post(
  "/validate/:strategyDecisionId",
  validateStrategyDecisionController,
);

export default router;