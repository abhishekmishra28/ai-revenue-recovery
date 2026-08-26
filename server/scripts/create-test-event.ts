import { prisma } from "../src/lib/prisma";

/**
 * ============================================================
 * AI REVENUE RECOVERY — TEST REVENUE EVENT GENERATOR
 * ============================================================
 *
 * PURPOSE
 * -------
 * This script creates a fresh RevenueEvent directly in the
 * database so that we can test the complete recovery pipeline
 * with a new event.
 *
 *
 * WHY DOES THIS SCRIPT EXIST?
 * ---------------------------
 * During development, our seeded RevenueEvents can only be
 * processed once because the event-processing layer implements
 * idempotency.
 *
 * Once a RevenueEvent has a processedAt timestamp, attempting
 * to process it again returns:
 *
 *     ALREADY_PROCESSED
 *
 * This is intentional and is an important property of a
 * production payment/revenue system because duplicate events
 * must not create duplicate recovery cases or duplicate
 * recovery actions.
 *
 * However, this creates a development/testing problem:
 *
 *     Old Event
 *        ↓
 *     processedAt != null
 *        ↓
 *     ALREADY_PROCESSED
 *
 * Therefore, when we need to demonstrate or test the complete
 * recovery pipeline again, we need a completely new RevenueEvent.
 *
 *
 * WHAT PROBLEM DOES IT SOLVE?
 * ---------------------------
 * It gives us a repeatable way to generate a fresh recovery
 * scenario without manually inserting records into PostgreSQL.
 *
 * The generated event can flow through:
 *
 * RevenueEvent
 *      ↓
 * Event Processing
 *      ↓
 * Recovery Case
 *      ↓
 * Gemini AI Strategy
 *      ↓
 * Policy Engine
 *      ↓
 * Recovery Action
 *      ↓
 * Action Execution
 *      ↓
 * Outcome
 *      ↓
 * Revenue Attribution
 *
 *
 * WHY DO WE USE AN EXISTING TRANSACTION?
 * --------------------------------------
 * The test event is linked to an existing transaction so that
 * the recovery engine can obtain real transaction information
 * such as:
 *
 * - amount
 * - currency
 * - payment method
 * - failure code
 * - transaction status
 *
 * This allows the AI strategy engine to make a decision using
 * realistic recovery context rather than fabricated transaction
 * data.
 *
 *
 * WHY IS externalEventId UNIQUE?
 * ------------------------------
 * RevenueEvent has a uniqueness constraint:
 *
 *     merchantId + externalEventId
 *
 * Payment providers normally send an external event identifier.
 * The system uses this identifier to prevent duplicate event
 * ingestion.
 *
 * We therefore generate a unique ID using Date.now() so that
 * every execution of this development script creates a new
 * event.
 *
 *
 * WHY IS processedAt NOT SET?
 * ---------------------------
 * A newly created event must represent an unprocessed event.
 *
 * Therefore processedAt remains null.
 *
 * The event-processing service will set processedAt only after
 * successful recovery-case detection.
 *
 *
 * WHY IS THIS NOT A PRODUCTION API?
 * ---------------------------------
 * This script directly writes to the database and is intended
 * only for local development, testing and hackathon demonstrations.
 *
 * In production, RevenueEvents should enter the system through
 * an authenticated API/webhook from a payment provider.
 *
 *
 * HACKATHON DEMONSTRATION VALUE
 * -----------------------------
 * This utility lets us repeatedly demonstrate the AI recovery
 * lifecycle using fresh events while preserving the system's
 * idempotency guarantees.
 *
 * Example:
 *
 *     npm/tsx script
 *          ↓
 *     Fresh PAYMENT_FAILED event
 *          ↓
 *     AI decides RETRY_PAYMENT
 *          ↓
 *     Policy validates decision
 *          ↓
 *     Recovery action executes
 *          ↓
 *     Outcome = SUCCESS
 *          ↓
 *     Revenue Attribution = DIRECT
 *
 * ============================================================
 */

const createTestEvent = async () => {
  try {
    /*
     * Create a fresh revenue event.
     *
     * We intentionally use PAYMENT_FAILED because this scenario
     * exercises the recovery pipeline and allows Gemini to
     * evaluate whether a payment retry is appropriate.
     */
    const event = await prisma.revenueEvent.create({
      data: {
        /*
         * Existing merchant used for the local development
         * dataset.
         */
        merchantId:
          "00000000-0000-4000-8000-000000000001",

        /*
         * Existing transaction gives the recovery engine
         * real payment information.
         */
        transactionId:
          "00000000-0000-4000-8000-000000001007",

        /*
         * Existing customer associated with the transaction.
         */
        customerId:
          "00000000-0000-4000-8000-000000000104",

        /*
         * This event represents a failed payment.
         */
        eventType: "PAYMENT_FAILED",

        /*
         * RevenueEvent requires a unique external event ID.
         *
         * Date.now() ensures that every execution creates a
         * different event and therefore does not violate the
         * event idempotency constraint.
         */
        externalEventId:
          `hackathon-test-${Date.now()}`,

        /*
         * Provider/event metadata.
         *
         * The failureCode is important because the AI strategy
         * engine uses payment failure information when deciding
         * which recovery strategy should be attempted.
         */
        payload: {
          scenario: "FRESH_RECOVERY_TEST",
          failureCode: "INSUFFICIENT_FUNDS",
        },

        /*
         * This represents when the revenue event occurred.
         *
         * processedAt is intentionally omitted, meaning the event
         * starts in the unprocessed state.
         */
        occurredAt: new Date(),
      },
    });

    /*
     * Print the important identifiers so the developer can
     * immediately pass the event ID to the orchestrator API.
     */
    console.log("\nFRESH EVENT CREATED\n");

    console.log("Event ID:", event.id);
    console.log("Event Type:", event.eventType);
    console.log("Transaction:", event.transactionId);
    console.log("Customer:", event.customerId);
    console.log("External ID:", event.externalEventId);
  } catch (error) {
    /*
     * Keep database/test-script failures visible during local
     * development instead of silently ignoring them.
     */
    console.error(
      "Failed to create test event:",
      error,
    );
  } finally {
    /*
     * Prisma maintains database connections.
     *
     * Explicitly disconnecting ensures the CLI process exits
     * cleanly after the test event has been created.
     */
    await prisma.$disconnect();
  }
};

/*
 * The function is called explicitly instead of using top-level
 * await because this project uses CommonJS.
 */
createTestEvent();