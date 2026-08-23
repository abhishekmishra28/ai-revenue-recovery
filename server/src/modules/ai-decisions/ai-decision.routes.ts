import { Router } from "express";

import {
  getAIDecisionsController,
  getAIDecisionByIdController,
  getAIDecisionsForRecoveryCaseController,
} from "./ai-decision.controller";

const router = Router();

router.get(
  "/",
  getAIDecisionsController
);

router.get(
  "/recovery-case/:recoveryCaseId",
  getAIDecisionsForRecoveryCaseController
);

router.get(
  "/:id",
  getAIDecisionByIdController
);

export default router;