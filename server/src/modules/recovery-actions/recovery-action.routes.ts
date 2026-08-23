import { Router } from "express";

import {
  getRecoveryActionsController,
  getRecoveryActionByIdController,
  getRecoveryActionsForRecoveryCaseController,
} from "./recovery-action.controller";

const router = Router();

router.get(
  "/",
  getRecoveryActionsController
);

router.get(
  "/recovery-case/:recoveryCaseId",
  getRecoveryActionsForRecoveryCaseController
);

router.get(
  "/:id",
  getRecoveryActionByIdController
);

export default router;