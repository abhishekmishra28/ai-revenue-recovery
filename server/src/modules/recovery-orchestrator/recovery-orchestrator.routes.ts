import { Router } from "express";

import {
  orchestrateRecoveryController,
} from "./recovery-orchestrator.controller";

const router = Router();

router.post(
  "/revenue-event/:revenueEventId",
  orchestrateRecoveryController,
);

export default router;