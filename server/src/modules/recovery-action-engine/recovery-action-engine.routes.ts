import { Router } from "express";

import {
  createRecoveryActionController,
  executeRecoveryActionController,
} from "./recovery-action-engine.controller";

const router = Router();

router.post(
  "/:strategyDecisionId",
  createRecoveryActionController,
);

router.post(
  "/:recoveryActionId/execute",
  executeRecoveryActionController,
);

export default router;