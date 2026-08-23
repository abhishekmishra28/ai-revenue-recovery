import { Router } from "express";
import {
  getMerchants,
  getMerchantById,
} from "./merchant.controller";

const router = Router();

router.get("/", getMerchants);
router.get("/:id", getMerchantById);

export default router;