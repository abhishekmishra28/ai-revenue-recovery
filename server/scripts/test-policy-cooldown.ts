import { prisma } from "../src/lib/prisma";
import {
  PaymentMethod,
  TransactionStatus,
  RecoveryActionStatus,
  RecoveryActionType,
} from "@prisma/client";

/**
 * ============================================================
 * AI REVENUE RECOVERY — COOLDOWN POLICY TEST
 * ============================================================
 *
 * PURPOSE
 * -------
 * Verifies that the Policy Engine prevents the same recovery
 * strategy from being executed again while the merchant's
 * cooldown period is active.
 *
 *
 * SEEDED POLICY
 * -------------
 *
 * RETRY_PAYMENT
 *
 * maxAmount       = ₹10,000
 * maxAttempts     = 2
 * cooldownSeconds = 3600
 *
 *
 * TEST
 * ----
 *
 * Previous RETRY_PAYMENT
 * executed 5 minutes ago
 *
 * Cooldown = 1 hour
 *
 * Therefore:
 *
 *     300 seconds < 3600 seconds
 *
 * Expected:
 *
 *     POLICY_REJECTED
 *
 *
 * IMPORTANT
 * ---------
 *
 * AI recommends the strategy.
 *
 * Policy Engine decides whether the strategy is allowed.
 *
 * ============================================================
 */

const MERCHANT_ID =
  "00000000-0000-4000-8000-000000000001";

const CUSTOMER_ID =
  "00000000-0000-4000-8000-000000000104";

const createCooldownPolicyTest = async () => {
  try {
    /*
     * ----------------------------------------------------------
     * STEP 1
     * Verify merchant exists.
     * ----------------------------------------------------------
     */

    const merchant = await prisma.merchant.findUnique({
      where: {
        id: MERCHANT_ID,
      },
    });

    if (!merchant) {
      throw new Error(
        `Merchant not found: ${MERCHANT_ID}`,
      );
    }

    /*
     * ----------------------------------------------------------
     * STEP 2
     * Verify customer exists.
     * ----------------------------------------------------------
     */

    const customer = await prisma.customer.findUnique({
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
     * Also make sure the customer belongs to the merchant.
     */

    if (customer.merchantId !== MERCHANT_ID) {
      throw new Error(
        `Customer ${CUSTOMER_ID} does not belong to merchant ${MERCHANT_ID}`,
      );
    }

    /*
     * ----------------------------------------------------------
     * STEP 3
     * Load RETRY_PAYMENT policy.
     * ----------------------------------------------------------
     */

    const policy =
      await prisma.policy.findUnique({
        where: {
          merchantId_actionType: {
            merchantId: MERCHANT_ID,
            actionType:
              RecoveryActionType.RETRY_PAYMENT,
          },
        },
      });

    if (!policy) {
      throw new Error(
        `RETRY_PAYMENT policy not found for merchant ${MERCHANT_ID}`,
      );
    }

    /*
     * Cooldown must be configured.
     */

    if (
      policy.cooldownSeconds === null ||
      policy.cooldownSeconds <= 0
    ) {
      throw new Error(
        "RETRY_PAYMENT policy does not have a valid cooldownSeconds value",
      );
    }

    /*
     * ----------------------------------------------------------
     * STEP 4
     * Create isolated failed transaction.
     * ----------------------------------------------------------
     */

    const transaction =
      await prisma.transaction.create({
        data: {
          merchantId: MERCHANT_ID,

          customerId: CUSTOMER_ID,

          externalTransactionId:
            `cooldown-test-${Date.now()}`,

          amount: "3999.00",

          currency: "INR",

          status:
            TransactionStatus.FAILED,

          paymentMethod:
            PaymentMethod.CARD,

          failureCode:
            "INSUFFICIENT_FUNDS",

          failureReason:
            "Insufficient funds",

          occurredAt: new Date(),
        },
      });

    /*
     * ----------------------------------------------------------
     * STEP 5
     * Create fresh RevenueEvent.
     *
     * processedAt remains NULL.
     * ----------------------------------------------------------
     */

    const event =
      await prisma.revenueEvent.create({
        data: {
          merchantId: MERCHANT_ID,

          transactionId:
            transaction.id,

          customerId: CUSTOMER_ID,

          eventType:
            "PAYMENT_FAILED",

          externalEventId:
            `cooldown-event-${Date.now()}`,

          payload: {
            scenario:
              "COOLDOWN_POLICY_TEST",

            failureCode:
              "INSUFFICIENT_FUNDS",
          },

          occurredAt: new Date(),
        },
      });

    /*
     * ----------------------------------------------------------
     * STEP 6
     * Create RecoveryCase manually.
     *
     * We need the case ID before creating the historical
     * RecoveryAction.
     * ----------------------------------------------------------
     */

    const recoveryCase =
      await prisma.recoveryCase.create({
        data: {
          merchantId: MERCHANT_ID,

          customerId: CUSTOMER_ID,

          transactionId:
            transaction.id,

          revenueEventId:
            event.id,

          caseType:
            "FAILED_PAYMENT",

          status:
            "OPEN",

          priority:
            "MEDIUM",

          riskLevel:
            "LOW",

          estimatedRecovery:
            "3999.00",

          currency:
            "INR",
        },
      });

    /*
     * IMPORTANT:
     *
     * We deliberately DO NOT set:
     *
     *     event.processedAt
     *
     * because the orchestrator must receive this event as a
     * fresh event.
     */

    /*
     * ----------------------------------------------------------
     * STEP 7
     * Create previous RETRY_PAYMENT.
     * ----------------------------------------------------------
     *
     * Cooldown:
     *
     *     3600 seconds = 1 hour
     *
     * Previous action:
     *
     *     300 seconds = 5 minutes ago
     *
     * Therefore cooldown is active.
     */

    const previousActionAgeSeconds = 300;

    const previousActionTime =
      new Date(
        Date.now() -
          previousActionAgeSeconds * 1000,
      );

    const previousAction =
      await prisma.recoveryAction.create({
        data: {
          recoveryCaseId:
            recoveryCase.id,

          actionType:
            RecoveryActionType.RETRY_PAYMENT,

          status:
            RecoveryActionStatus.SUCCEEDED,

          idempotencyKey:
            `cooldown-test-${recoveryCase.id}`,

          parameters: {
            testScenario:
              "COOLDOWN_ACTIVE",
          },

          executedAt:
            previousActionTime,

          completedAt:
            previousActionTime,
        },
      });

    /*
     * ----------------------------------------------------------
     * STEP 8
     * Print test information.
     * ----------------------------------------------------------
     */

    console.log(
      "\n========== COOLDOWN POLICY TEST ==========\n",
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
      "Cooldown:",
      policy.cooldownSeconds,
      "seconds",
    );

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
      "Recovery Case ID:",
      recoveryCase.id,
    );

    console.log(
      "Previous Action ID:",
      previousAction.id,
    );

    console.log(
      "Previous Action:",
      previousAction.actionType,
    );

    console.log(
      "Previous Action Status:",
      previousAction.status,
    );

    console.log(
      "Previous Action Time:",
      previousAction.executedAt,
    );

    console.log(
      "Previous Action Age:",
      previousActionAgeSeconds,
      "seconds",
    );

    console.log(
      "Policy Cooldown:",
      policy.cooldownSeconds,
      "seconds",
    );

    console.log(
      "\nCooldown Active:",
      previousActionAgeSeconds <
        policy.cooldownSeconds,
    );

    console.log(
      "\nExpected Result:",
      "POLICY_REJECTED",
    );

    console.log(
      "Expected Reason:",
      "Recovery action is still within merchant policy cooldown",
    );

    console.log(
      "\nRun the orchestrator with:",
    );

    console.log(
      `curl -X POST http://localhost:4000/recovery-orchestrator/revenue-event/${event.id}`,
    );

    console.log(
      "\n===========================================\n",
    );
  } catch (error) {
    console.error(
      "Failed to create cooldown policy test:",
      error,
    );
  } finally {
    await prisma.$disconnect();
  }
};

createCooldownPolicyTest();