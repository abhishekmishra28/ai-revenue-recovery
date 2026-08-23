import { Router } from "express";
import {
  getRecoveryCasesController,
  getRecoveryCaseController,
} from "./recovery-case.controller";

const router = Router();

router.get("/", getRecoveryCasesController);
router.get("/:id", getRecoveryCaseController);

export default router;