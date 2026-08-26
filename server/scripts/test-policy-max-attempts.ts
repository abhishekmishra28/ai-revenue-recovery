import { prisma } from "../src/lib/prisma";

import {
  PaymentMethod,
  TransactionStatus,
  RecoveryActionStatus,
  RecoveryActionType,
} from "@prisma/client";

/**
 * ============================================================
 * AI REVENUE RECOVERY — MAXIMUM ATTEMPTS POLICY TEST
 * ============================================================
 *
 * PURPOSE
 * -------
 * Verify that the Policy Engine prevents a recovery strategy
 * from being executed after the merchant's configured maximum
 * number of attempts has already been reached.
 *
 *
 * CURRENT SEEDED POLICY
 * ---------------------
 *
 * RETRY_PAYMENT
 * maxAttempts = 2
 *
 * Therefore:
 *
 * Attempt 1 → allowed
 * Attempt 2 → allowed
 * Attempt 3 → rejected
 *
 *
 * IMPORTANT ARCHITECTURE PRINCIPLE
 * --------------------------------
 *
 * The AI may recommend RETRY_PAYMENT again.
 *
 * However, the AI does NOT control how many times the action
 * can execute.
 *
 * The Policy Engine independently enforces merchant limits.
 *
 *
 * EXPECTED FLOW
 * -------------
 *
 * Failed Payment
 *      ↓
 * Revenue Event
 *      ↓
 * Recovery Case
 *      ↓
 * Existing recovery attempts = 2
 *      ↓
 * Gemini recommends RETRY_PAYMENT
 *      ↓
 * Policy Engine
 *      ↓
 * attempts >= maxAttempts
 *      ↓
 * Decision = REJECTED
 *      ↓
 * ❌ No new RecoveryAction
 * ❌ No Outcome
 * ❌ No Revenue Attribution
 *
 *
 * IMPORTANT
 * ---------
 *
 * The RevenueEvent MUST remain unprocessed.
 *
 * If processedAt is set before the orchestrator runs,
 * the orchestrator will correctly return:
 *
 *     ALREADY_PROCESSED
 *
 * Therefore this script intentionally leaves:
 *
 *     processedAt = null
 *
 * The orchestrator is responsible for processing the event.
 *
 * ============================================================
 */

const MERCHANT_ID =
  "00000000-0000-0000-0000-000000000001";

const CUSTOMER_ID =
  "00000000-0000-0000-0000-000000000104";

const createMaxAttemptsPolicyTest = async () => {
  try {
    /*
     * ----------------------------------------------------------
     * STEP 1
     * Create an isolated failed transaction.
     * ----------------------------------------------------------
     */

    const transaction = await prisma.transaction.create({
      data: {
        merchantId: MERCHANT_ID,

        customerId: CUSTOMER_ID,

        externalTransactionId:
          `max-attempts-test-${Date.now()}`,

        amount: "3999.00",

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
     * processedAt is intentionally NOT provided.
     *
     * Therefore:
     *
     * processedAt = null
     *
     * and the orchestrator can process this event.
     */

    const event = await prisma.revenueEvent.create({
      data: {
        merchantId: MERCHANT_ID,

        transactionId: transaction.id,

        customerId: CUSTOMER_ID,

        eventType: "PAYMENT_FAILED",

        externalEventId:
          `max-attempts-event-${Date.now()}`,

        payload: {
          scenario: "MAX_ATTEMPTS_POLICY_TEST",

          failureCode: "INSUFFICIENT_FUNDS",
        },

        occurredAt: new Date(),
      },
    });

    /*
     * ----------------------------------------------------------
     * STEP 3
     * Create the RecoveryCase.
     * ----------------------------------------------------------
     *
     * We need the RecoveryCase ID so that we can attach
     * historical RecoveryAction records to it.
     */

    const recoveryCase =
      await prisma.recoveryCase.create({
        data: {
          merchantId: MERCHANT_ID,

          customerId: CUSTOMER_ID,

          transactionId: transaction.id,

          revenueEventId: event.id,

          caseType: "FAILED_PAYMENT",

          status: "OPEN",

          priority: "MEDIUM",

          riskLevel: "LOW",

          estimatedRecovery: "3999.00",

          currency: "INR",
        },
      });

    /*
     * ----------------------------------------------------------
     * STEP 4
     * DO NOT mark the RevenueEvent as processed.
     * ----------------------------------------------------------
     *
     * This is extremely important.
     *
     * The orchestrator uses processedAt for event idempotency.
     *
     * If we set:
     *
     *     processedAt = new Date()
     *
     * then the orchestrator will return:
     *
     *     ALREADY_PROCESSED
     *
     * Therefore processedAt intentionally remains NULL.
     */

    /*
     * ----------------------------------------------------------
     * STEP 5
     * Create two historical RETRY_PAYMENT attempts.
     * ----------------------------------------------------------
     *
     * The merchant policy allows:
     *
     *     maxAttempts = 2
     *
     * We therefore create:
     *
     *     Attempt 1 → SUCCEEDED
     *     Attempt 2 → SUCCEEDED
     *
     * The next RETRY_PAYMENT recommendation should therefore
     * be rejected by the Policy Engine.
     */

    await prisma.recoveryAction.createMany({
      data: [
        {
          recoveryCaseId: recoveryCase.id,

          actionType:
            RecoveryActionType.RETRY_PAYMENT,

          status:
            RecoveryActionStatus.SUCCEEDED,

          idempotencyKey:
            `max-attempts-test-1-${recoveryCase.id}`,

          parameters: {
            testAttempt: 1,
          },

          executedAt: new Date(),

          completedAt: new Date(),
        },

        {
          recoveryCaseId: recoveryCase.id,

          actionType:
            RecoveryActionType.RETRY_PAYMENT,

          status:
            RecoveryActionStatus.SUCCEEDED,

          idempotencyKey:
            `max-attempts-test-2-${recoveryCase.id}`,

          parameters: {
            testAttempt: 2,
          },

          executedAt: new Date(),

          completedAt: new Date(),
        },
      ],
    });

    /*
     * ----------------------------------------------------------
     * STEP 6
     * Display test information.
     * ----------------------------------------------------------
     */

    console.log(
      "\n========== MAX ATTEMPTS POLICY TEST ==========\n",
    );

    console.log(
      "Transaction ID:",
      transaction.id,
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
      "Existing Recovery Attempts: 2",
    );

    console.log(
      "Policy maxAttempts: 2",
    );

    console.log(
      "RevenueEvent processedAt: NULL",
    );

    console.log(
      "\nExpected Result: POLICY_REJECTED",
    );

    console.log(
      "\nExpected Policy Behaviour:",
    );

    console.log(
      "attempts >= maxAttempts",
    );

    console.log(
      "2 >= 2 → REJECT",
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
      "Failed to create max attempts policy test:",
      error,
    );
  } finally {
    await prisma.$disconnect();
  }
};

createMaxAttemptsPolicyTest();