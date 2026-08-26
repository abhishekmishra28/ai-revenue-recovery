import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const MERCHANT_ID =
  "00000000-0000-4000-8000-000000000001";

const main = async () => {
  /*
   * POLICY REJECTION TEST
   *
   * Purpose:
   * Verify that the policy engine can stop an AI-generated
   * recovery strategy before a recovery action is created.
   *
   * Scenario:
   * - Existing RETRY_PAYMENT policy is temporarily disabled.
   * - A fresh PAYMENT_FAILED event is created.
   * - The recovery pipeline should reach AI strategy generation.
   * - Policy validation should reject RETRY_PAYMENT.
   * - No RecoveryAction should be created.
   * - No Outcome should be created.
   * - No RevenueAttribution should be created.
   *
   * This demonstrates an important safety boundary:
   *
   * AI recommends.
   * Deterministic merchant policy authorizes.
   * Execution happens only after authorization.
   *
   * The original policy state is restored in finally so this
   * test does not permanently modify development data.
   */

  const policy =
    await prisma.policy.findUnique({
      where: {
        merchantId_actionType: {
          merchantId: MERCHANT_ID,
          actionType: "RETRY_PAYMENT",
        },
      },
    });

  if (!policy) {
    throw new Error(
      "RETRY_PAYMENT policy not found",
    );
  }

  const originalEnabled = policy.enabled;

  console.log(
    "Original policy enabled:",
    originalEnabled,
  );

  try {
    /*
     * Temporarily disable the policy.
     */
    await prisma.policy.update({
      where: {
        id: policy.id,
      },
      data: {
        enabled: false,
      },
    });

    console.log(
      "RETRY_PAYMENT policy disabled",
    );

    /*
     * Create a fresh revenue event.
     *
     * We reuse the existing transaction/customer because
     * the test is focused on policy validation rather than
     * transaction creation.
     */
    const event =
      await prisma.revenueEvent.create({
        data: {
          merchantId: MERCHANT_ID,
          transactionId:
            "00000000-0000-4000-8000-000000001007",
          customerId:
            "00000000-0000-4000-8000-000000000104",
          eventType: "PAYMENT_FAILED",
          externalEventId:
            `policy-rejection-test-${Date.now()}`,
          payload: {
            scenario:
              "POLICY_REJECTION_TEST",
            failureCode:
              "INSUFFICIENT_FUNDS",
          },
          occurredAt: new Date(),
        },
      });

    console.log(
      "\nFresh event created:",
      event.id,
    );

    /*
     * Import the orchestrator only after the test
     * event has been created.
     */
    const {
      orchestrateRecovery,
    } =
      await import(
        "../src/modules/recovery-orchestrator/recovery-orchestrator.service"
      );

    const result =
      await orchestrateRecovery(event.id);

    console.log(
      "\n========== POLICY REJECTION RESULT ==========",
    );

    console.log(
      "Status:",
      result.status,
    );

    console.log(
      "Strategy:",
      result.strategyDecision?.decision,
    );

    console.log(
      "Validation:",
      result.validatedDecision?.status,
    );

    console.log(
      "Recovery Action:",
      result.recoveryAction?.id ?? null,
    );

    console.log(
      "Outcome:",
      result.outcome?.id ?? null,
    );

    console.log(
      "Attribution:",
      result.attribution?.id ?? null,
    );

    /*
     * Assertions.
     */
    if (
      result.status !==
      "POLICY_REJECTED"
    ) {
      throw new Error(
        `Expected POLICY_REJECTED but received ${result.status}`,
      );
    }

    if (
      result.validatedDecision?.status !==
      "REJECTED"
    ) {
      throw new Error(
        "Expected strategy decision to be REJECTED",
      );
    }

    if (result.recoveryAction !== null) {
      throw new Error(
        "RecoveryAction should not be created",
      );
    }

    if (result.outcome !== null) {
      throw new Error(
        "Outcome should not be created",
      );
    }

    if (result.attribution !== null) {
      throw new Error(
        "RevenueAttribution should not be created",
      );
    }

    console.log(
      "\nPOLICY REJECTION TEST PASSED",
    );
  } finally {
    /*
     * Always restore the original policy state,
     * even if the test fails.
     */
    await prisma.policy.update({
      where: {
        id: policy.id,
      },
      data: {
        enabled: originalEnabled,
      },
    });

    console.log(
      "Policy restored:",
      originalEnabled,
    );

    await prisma.$disconnect();
  }
};

main().catch(async (error) => {
  console.error(
    "\nPOLICY REJECTION TEST FAILED",
  );

  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});