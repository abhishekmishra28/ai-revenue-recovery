import { Router } from "express";

import {
  getOutcomesController,
  getOutcomeByIdController,
  getOutcomesForRecoveryCaseController,
  getOutcomeForRecoveryActionController,
  createOutcomeController,
} from "./outcome.controller";

const router = Router();

router.get("/", getOutcomesController);
router.post("/", createOutcomeController);
router.get(
  "/recovery-case/:recoveryCaseId",
  getOutcomesForRecoveryCaseController,
);

router.get(
  "/action/:recoveryActionId",
  getOutcomeForRecoveryActionController,
);

router.get("/:id", getOutcomeByIdController);

export default router;