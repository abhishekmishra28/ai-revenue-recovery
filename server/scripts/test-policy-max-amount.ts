import { prisma } from "../src/lib/prisma";

import {
  PaymentMethod,
  TransactionStatus,
} from "@prisma/client";

/**
 * ============================================================
 * AI REVENUE RECOVERY — MAXIMUM RECOVERY AMOUNT POLICY TEST
 * ============================================================
 *
 * PURPOSE
 * -------
 * Verify that the Policy Engine prevents an AI-generated
 * recovery strategy from operating above the merchant's
 * configured maximum recovery amount.
 *
 *
 * CURRENT SEEDED POLICY
 * ---------------------
 *
 * RETRY_PAYMENT
 *
 * maxAmount = ₹10,000
 *
 *
 * TEST TRANSACTION
 * ----------------
 *
 * Transaction amount = ₹15,000
 *
 * Therefore:
 *
 *     ₹15,000 > ₹10,000
 *
 * The AI may recommend RETRY_PAYMENT, but the Policy Engine
 * must reject that recommendation.
 *
 *
 * SECURITY PRINCIPLE
 * ------------------
 *
 * AI proposes.
 *
 * Policy decides.
 *
 * Execution happens only after policy validation.
 *
 *
 * EXPECTED FLOW
 * -------------
 *
 * High-value Transaction
 *          ↓
 * PAYMENT_FAILED Event
 *          ↓
 * Recovery Case
 *          ↓
 * estimatedRecovery = ₹15,000
 *          ↓
 * Gemini recommends RETRY_PAYMENT
 *          ↓
 * Policy Engine
 *          ↓
 * ₹15,000 > ₹10,000
 *          ↓
 * Decision = REJECTED
 *          ↓
 * ❌ No RecoveryAction
 * ❌ No Outcome
 * ❌ No Revenue Attribution
 *
 *
 * IMPORTANT
 * ---------
 *
 * This script creates a fresh RevenueEvent and intentionally
 * leaves processedAt as NULL.
 *
 * The orchestrator must process the event.
 *
 * ============================================================
 */

const MERCHANT_ID =
  "00000000-0000-0000-0000-000000000001";

const CUSTOMER_ID =
  "00000000-0000-0000-0000-000000000104";

const createMaxAmountPolicyTest = async () => {
  try {
    /*
     * ----------------------------------------------------------
     * STEP 1
     * Create an isolated high-value transaction.
     * ----------------------------------------------------------
     *
     * Merchant policy:
     *
     *     maxAmount = ₹10,000
     *
     * Test transaction:
     *
     *     amount = ₹15,000
     *
     * Therefore the transaction intentionally exceeds the
     * configured financial policy boundary.
     */

    const transaction =
      await prisma.transaction.create({
        data: {
          merchantId: MERCHANT_ID,

          customerId: CUSTOMER_ID,

          externalTransactionId:
            `max-amount-test-${Date.now()}`,

          amount: "15000.00",

          currency: "INR",

          status: TransactionStatus.FAILED,

          paymentMethod: PaymentMethod.CARD,

          failureCode: "INSUFFICIENT_FUNDS",

          failureReason: "Insufficient funds",

          occurredAt: new Date(),
        },
      });

    /*
     * ----------------------------------------------------------
     * STEP 2
     * Create a fresh PAYMENT_FAILED RevenueEvent.
     * ----------------------------------------------------------
     *
     * processedAt is intentionally omitted.
     *
     * Therefore:
     *
     *     processedAt = NULL
     *
     * and the orchestrator can process the event.
     */

    const event =
      await prisma.revenueEvent.create({
        data: {
          merchantId: MERCHANT_ID,

          transactionId: transaction.id,

          customerId: CUSTOMER_ID,

          eventType: "PAYMENT_FAILED",

          externalEventId:
            `max-amount-event-${Date.now()}`,

          payload: {
            scenario: "MAX_AMOUNT_POLICY_TEST",

            failureCode: "INSUFFICIENT_FUNDS",
          },

          occurredAt: new Date(),
        },
      });

    /*
     * ----------------------------------------------------------
     * STEP 3
     * Display test information.
     * ----------------------------------------------------------
     */

    console.log(
      "\n========== MAX AMOUNT POLICY TEST ==========\n",
    );

    console.log(
      "Transaction ID:",
      transaction.id,
    );

    console.log(
      "Transaction Amount: ₹15,000",
    );

    console.log(
      "Revenue Event ID:",
      event.id,
    );

    console.log(
      "RevenueEvent processedAt: NULL",
    );

    console.log(
      "\nExpected Policy Limit: ₹10,000",
    );

    console.log(
      "Expected Transaction Amount: ₹15,000",
    );

    console.log(
      "Expected Comparison: ₹15,000 > ₹10,000",
    );

    console.log(
      "Expected Result: POLICY_REJECTED",
    );

    console.log(
      "\nRun the orchestrator with:",
    );

    console.log(
      `curl -X POST http://localhost:4000/recovery-orchestrator/revenue-event/${event.id}`,
    );

    console.log(
      "\n================================================\n",
    );
  } catch (error) {
    console.error(
      "Failed to create max amount policy test:",
      error,
    );
  } finally {
    await prisma.$disconnect();
  }
};

createMaxAmountPolicyTest();