import {
  PaymentMethod,
  RevenueEventType,
  TransactionStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { orchestrateRecovery } from "../recovery-orchestrator/recovery-orchestrator.service";

export interface ScenarioInput {
  merchantId: string;
  customerId?: string;
  eventType:
    | "PAYMENT_FAILED"
    | "CHECKOUT_ABANDONED"
    | "SUBSCRIPTION_PAYMENT_FAILED";
  amount: number;
  currency?: string;
  paymentMethod?: "CARD" | "UPI" | "NET_BANKING" | "WALLET";
  failureCode?: string;
  failureReason?: string;
  subscriptionPlan?: string;
  checkoutItems?: number;
}

const uniqueSuffix = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const simulateScenario = async (input: ScenarioInput) => {
  const currency = input.currency ?? "INR";
  const pipelineStart = Date.now();

  /*
   * 1. Validate merchant.
   */
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
  });

  if (!merchant) {
    throw new Error(`Merchant not found: ${input.merchantId}`);
  }

  /*
   * 2. Resolve customer.
   *    Use provided customerId, or pick the first customer for the merchant.
   */
  let customerId = input.customerId;

  if (!customerId) {
    const customer = await prisma.customer.findFirst({
      where: { merchantId: input.merchantId },
    });

    if (!customer) {
      throw new Error(
        `No customers found for merchant ${input.merchantId}. Run the seed first.`
      );
    }

    customerId = customer.id;
  }

  /*
   * 3. Create a transaction for payment failure scenarios.
   */
  let transactionId: string | undefined;

  if (input.eventType === "PAYMENT_FAILED") {
    const transaction = await prisma.transaction.create({
      data: {
        merchantId: input.merchantId,
        customerId,
        externalTransactionId: `sim-txn-${uniqueSuffix()}`,
        amount: input.amount,
        currency,
        status: TransactionStatus.FAILED,
        paymentMethod:
          (input.paymentMethod as PaymentMethod) ?? PaymentMethod.CARD,
        failureCode: input.failureCode ?? "BANK_TIMEOUT",
        failureReason:
          input.failureReason ?? "Simulated payment failure",
        occurredAt: new Date(),
      },
    });

    transactionId = transaction.id;
  }

  /*
   * 4. Create the revenue event.
   *    externalEventId is unique per run so the orchestrator
   *    never hits the ALREADY_PROCESSED idempotency guard.
   */
  const event = await prisma.revenueEvent.create({
    data: {
      merchantId: input.merchantId,
      customerId,
      transactionId,
      eventType: input.eventType as RevenueEventType,
      externalEventId: `sim-event-${uniqueSuffix()}`,
      payload: {
        simulated: true,
        amount: input.amount,
        currency,
        failureCode: input.failureCode,
        failureReason: input.failureReason,
        subscriptionPlan: input.subscriptionPlan,
        checkoutItems: input.checkoutItems,
        timestamp: new Date().toISOString(),
      },
      occurredAt: new Date(),
    },
  });

  /*
   * 5. Run the full recovery pipeline.
   *    This reuses the existing orchestrator without modification.
   */
  const pipelineResult = await orchestrateRecovery(event.id);

  /*
   * 6. Return the pipeline result with simulation metadata.
   */
  return {
    ...pipelineResult,
    meta: {
      simulatedEventId: event.id,
      merchantName: merchant.name,
      durationMs: Date.now() - pipelineStart,
    },
  };
};
