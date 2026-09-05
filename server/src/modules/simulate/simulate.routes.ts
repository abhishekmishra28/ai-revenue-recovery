import { Router } from "express";
import { simulateScenarioController } from "./simulate.controller";

const router = Router();

/**
 * @swagger
 * /simulate/scenario:
 *   post:
 *     summary: Create a fresh scenario and run the full recovery pipeline
 *     tags: [Recovery Engine]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantId, eventType, amount]
 *             properties:
 *               merchantId:
 *                 type: string
 *                 format: uuid
 *               eventType:
 *                 type: string
 *                 enum: [PAYMENT_FAILED, CHECKOUT_ABANDONED, SUBSCRIPTION_PAYMENT_FAILED]
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: INR
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, UPI, NET_BANKING, WALLET]
 *               failureCode:
 *                 type: string
 *               failureReason:
 *                 type: string
 *               subscriptionPlan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Full pipeline result with simulation metadata
 */
router.post("/scenario", simulateScenarioController);

export default router;
