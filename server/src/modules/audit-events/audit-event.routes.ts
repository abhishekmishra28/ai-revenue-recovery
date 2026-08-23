import { Router } from "express";

import {
  getAuditEventsController,
  getAuditEventByIdController,
  getAuditEventsForMerchantController,
  getAuditEventsForRecoveryCaseController,
} from "./audit-event.controller";

const router = Router();

router.get("/", getAuditEventsController);

router.get(
  "/merchant/:merchantId",
  getAuditEventsForMerchantController,
);

router.get(
  "/recovery-case/:recoveryCaseId",
  getAuditEventsForRecoveryCaseController,
);

router.get("/:id", getAuditEventByIdController);

export default router;