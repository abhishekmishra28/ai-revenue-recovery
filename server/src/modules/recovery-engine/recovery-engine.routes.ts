import { Router } from "express";

import {
  detectRecoveryCaseController,
} from "./recovery-engine.controller";

const router = Router();

router.post(
  "/detect/:revenueEventId",
  detectRecoveryCaseController
);

export default router;