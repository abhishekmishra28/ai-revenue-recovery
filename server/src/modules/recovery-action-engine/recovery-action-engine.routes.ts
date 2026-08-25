import { Router } from "express";

import {
  createRecoveryActionController,
} from "./recovery-action-engine.controller";

const router = Router();

router.post(
  "/create/:strategyDecisionId",
  createRecoveryActionController,
);

export default router;