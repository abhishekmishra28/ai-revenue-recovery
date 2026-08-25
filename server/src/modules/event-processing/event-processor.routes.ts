import { Router } from "express";
import {
  processRevenueEventController,
} from "./event-processor.controller";

const router = Router();

router.post(
  "/:revenueEventId/process",
  processRevenueEventController,
);

export default router;