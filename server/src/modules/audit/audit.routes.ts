import { Router } from "express";

import {
  getAuditEventsByMerchantController,
  getAuditEventsByRecoveryCaseController,
} from "./audit.controller";

const router = Router();

router.get(
  "/merchant/:merchantId",
  getAuditEventsByMerchantController,
);

router.get(
  "/recovery-case/:recoveryCaseId",
  getAuditEventsByRecoveryCaseController,
);

export default router;