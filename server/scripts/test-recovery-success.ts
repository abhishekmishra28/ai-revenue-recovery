import { prisma } from "../src/lib/prisma";

import {
  PaymentMethod,
  TransactionStatus,
} from "@prisma/client";

/**
 * ============================================================
 * AI REVENUE RECOVERY — SUCCESSFUL RECOVERY TEST
 * ============================================================
 *
 * PURPOSE
 * -------
 * Creates an isolated failed payment and runs it through the
 * complete recovery orchestrator.
 *
 * Expected:
 *
 * PAYMENT_FAILED
 *      ↓
 * RecoveryCase
 *      ↓
 * AI Strategy
 *      ↓
 * Policy Validation
 *      ↓
 * RecoveryAction
 *      ↓
 * Execution
 *      ↓
 * Outcome SUCCESS
 *      ↓
 * RecoveryCase RECOVERED
 *      ↓
 * Revenue Attribution
 *
 * ============================================================
 */

const MERCHANT_ID =
  "00000000-0000-4000-8000-000000000001";

const CUSTOMER_ID =
  "00000000-0000-4000-8000-000000000104";

const createSuccessfulRecoveryTest = async () => {
  try {
    /*
     * ========================================================
     * STEP 1
     * Verify RETRY_PAYMENT policy.
     *
     * Do not assume the merchant record is needed here.
     * The policy itself proves that the configured merchant
     * policy exists.
     * ========================================================
     */

    const policy =
      await prisma.policy.findUnique({
        where: {
          merchantId_actionType: {
            merchantId:
              MERCHANT_ID,

            actionType:
              "RETRY_PAYMENT",
          },
        },
      });

    if (!policy) {
      throw new Error(
        `RETRY_PAYMENT policy not found for merchant ${MERCHANT_ID}`,
      );
    }

    if (!policy.enabled) {
      throw new Error(
        "RETRY_PAYMENT policy is disabled",
      );
    }

    /*
     * ========================================================
     * STEP 2
     * Verify customer.
     *
     * This gives a clear error before the transaction FK
     * constraint fails.
     * ========================================================
     */

    const customer =
      await prisma.customer.findUnique({
        where: {
          id: CUSTOMER_ID,
        },
      });

    if (!customer) {
      throw new Error(
        `Customer not found: ${CUSTOMER_ID}`,
      );
    }

    /*
     * ========================================================
     * STEP 3
     * Display policy information.
     * ========================================================
     */

    console.log(
      "\n========== SUCCESSFUL RECOVERY TEST ==========\n",
    );

    console.log(
      "Merchant ID:",
      MERCHANT_ID,
    );

    console.log(
      "Customer ID:",
      CUSTOMER_ID,
    );

    console.log(
      "Policy:",
      policy.name,
    );

    console.log(
      "Action:",
      policy.actionType,
    );

    console.log(
      "Max Amount:",
      policy.maxAmount?.toString() ??
        "unlimited",
    );

    console.log(
      "Max Attempts:",
      policy.maxAttempts ??
        "unlimited",
    );

    console.log(
      "Cooldown:",
      policy.cooldownSeconds ??
        "disabled",
      "seconds",
    );

    /*
     * ========================================================
     * STEP 4
     * Create isolated failed transaction.
     *
     * Amount = ₹3,999
     *
     * This is safely below:
     *
     * maxAmount = ₹10,000
     * ========================================================
     */

    const transaction =
      await prisma.transaction.create({
        data: {
          merchantId:
            MERCHANT_ID,

          customerId:
            CUSTOMER_ID,

          externalTransactionId:
            `success-test-${Date.now()}`,

          amount:
            "3999.00",

          currency:
            "INR",

          status:
            TransactionStatus.FAILED,

          paymentMethod:
            PaymentMethod.CARD,

          failureCode:
            "INSUFFICIENT_FUNDS",

          failureReason:
            "Insufficient funds",

          occurredAt:
            new Date(),
        },
      });

    /*
     * ========================================================
     * STEP 5
     * Create fresh PAYMENT_FAILED event.
     *
     * processedAt is intentionally NULL.
     * ========================================================
     */

    const event =
      await prisma.revenueEvent.create({
        data: {
          merchantId:
            MERCHANT_ID,

          transactionId:
            transaction.id,

          customerId:
            CUSTOMER_ID,

          eventType:
            "PAYMENT_FAILED",

          externalEventId:
            `success-test-event-${Date.now()}`,

          payload: {
            scenario:
              "SUCCESSFUL_RECOVERY_TEST",

            failureCode:
              "INSUFFICIENT_FUNDS",
          },

          occurredAt:
            new Date(),
        },
      });

    /*
     * ========================================================
     * STEP 6
     * Print identifiers.
     * ========================================================
     */

    console.log(
      "\nTransaction ID:",
      transaction.id,
    );

    console.log(
      "Transaction Amount: ₹3,999",
    );

    console.log(
      "Revenue Event ID:",
      event.id,
    );

    console.log(
      "\nExpected Flow:",
    );

    console.log(
      "PAYMENT_FAILED",
    );

    console.log(
      "      ↓",
    );

    console.log(
      "Gemini → RETRY_PAYMENT",
    );

    console.log(
      "      ↓",
    );

    console.log(
      "Policy → VALIDATED",
    );

    console.log(
      "      ↓",
    );

    console.log(
      "RecoveryAction → CREATED",
    );

    console.log(
      "      ↓",
    );

    console.log(
      "Execution → SUCCEEDED",
    );

    console.log(
      "      ↓",
    );

    console.log(
      "Outcome → SUCCESS",
    );

    console.log(
      "      ↓",
    );

    console.log(
      "RecoveryCase → RECOVERED",
    );

    console.log(
      "      ↓",
    );

    console.log(
      "Revenue Attribution",
    );

    console.log(
      "\nRun:",
    );

    console.log(
      `curl -X POST http://localhost:4000/recovery-orchestrator/revenue-event/${event.id}`,
    );

    console.log(
      "\nExpected final status:",
      "RECOVERY_SUCCEEDED",
    );

    console.log(
      "\n===============================================\n",
    );
  } catch (error) {
    console.error(
      "\nFailed to create successful recovery test:",
      error,
    );
  } finally {
    await prisma.$disconnect();
  }
};

createSuccessfulRecoveryTest();