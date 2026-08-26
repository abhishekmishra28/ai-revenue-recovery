import { prisma } from "../src/lib/prisma";
import {
  PaymentMethod,
  TransactionStatus,
  RecoveryActionStatus,
  RecoveryActionType,
} from "@prisma/client";

const MERCHANT_ID =
  "00000000-0000-4000-8000-000000000001";

const CUSTOMER_ID =
  "00000000-0000-4000-8000-000000000104";

const createRecoveryFailureTest = async () => {
  try {
    /*
     * ----------------------------------------------------------
     * STEP 1
     * Validate merchant.
     * ----------------------------------------------------------
     */
    const merchant =
      await prisma.merchant.findUnique({
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
     * Validate customer.
     * ----------------------------------------------------------
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
     * ----------------------------------------------------------
     * STEP 3
     * Load policy.
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

    console.log(
      "\n========== RECOVERY FAILURE TEST ==========\n",
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

    /*
     * ----------------------------------------------------------
     * STEP 4
     * Create failed transaction.
     * ----------------------------------------------------------
     */
    const transaction =
      await prisma.transaction.create({
        data: {
          merchantId:
            MERCHANT_ID,

          customerId:
            CUSTOMER_ID,

          externalTransactionId:
            `failure-test-${Date.now()}`,

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
     * ----------------------------------------------------------
     * STEP 5
     * Create revenue event.
     * ----------------------------------------------------------
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
            `failure-event-${Date.now()}`,

          payload: {
            scenario:
              "EXECUTION_FAILURE",

            failureCode:
              "INSUFFICIENT_FUNDS",
          },

          occurredAt:
            new Date(),
        },
      });

    /*
     * ----------------------------------------------------------
     * STEP 6
     * Print test information.
     * ----------------------------------------------------------
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

    console.log(`
PAYMENT_FAILED
      ↓
Gemini → RETRY_PAYMENT
      ↓
Policy → VALIDATED
      ↓
RecoveryAction → CREATED
      ↓
Execution → FAILED
      ↓
Outcome → FAILED
      ↓
RecoveryCase → OPEN
      ↓
NO Revenue Attribution
`);

    console.log(
      "Run:",
    );

    console.log(
      `curl -X POST http://localhost:4000/recovery-orchestrator/revenue-event/${event.id}`,
    );

    console.log(
      "\nExpected final status: RECOVERY_FAILED",
    );

    console.log(
      "\n===========================================\n",
    );
  } catch (error) {
    console.error(
      "Failed to create recovery failure test:",
      error,
    );
  } finally {
    await prisma.$disconnect();
  }
};

createRecoveryFailureTest();