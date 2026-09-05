import { Router } from "express";
import {
  getAllPoliciesController,
  getPoliciesByMerchantController,
} from "./policies.controller";

const router = Router();

router.get("/", getAllPoliciesController);
router.get("/merchant/:merchantId", getPoliciesByMerchantController);

export default router;
