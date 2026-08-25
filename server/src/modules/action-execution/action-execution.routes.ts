import { Router } from "express";

import {
  executeRecoveryActionController,
} from "./action-execution.controller";

const router = Router();

router.post(
  "/execute/:recoveryActionId",
  executeRecoveryActionController,
);

export default router;
