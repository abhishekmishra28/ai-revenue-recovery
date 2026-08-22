import {
  PrismaClient,
  MerchantStatus,
  TransactionStatus,
  PaymentMethod,
  RevenueEventType,
  RecoveryCaseType,
  RecoveryCaseStatus,
  Priority,
  RiskLevel,
  RecoveryStrategy,
  DecisionStatus,
  RecoveryActionType,
  RecoveryActionStatus,
  OutcomeStatus,
  AttributionType,
  ActorType,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const DEMO = {
  merchants: {
    primary: "00000000-0000-4000-8000-000000000001",
    secondary: "00000000-0000-4000-8000-000000000002",
  },
  customers: {
    c001: "00000000-0000-4000-8000-000000000101",
    c002: "00000000-0000-4000-8000-000000000102",
    c003: "00000000-0000-4000-8000-000000000103",
    c004: "00000000-0000-4000-8000-000000000104",
    c005: "00000000-0000-4000-8000-000000000105",
  },
  transactions: {
    s01: "00000000-0000-4000-8000-000000001001",
    s02: "00000000-0000-4000-8000-000000001002",
    s03: "00000000-0000-4000-8000-000000001003",
    s07: "00000000-0000-4000-8000-000000001007",
  },
  events: {
    s01: "00000000-0000-4000-8000-000000002001",
    s02: "00000000-0000-4000-8000-000000002002",
    s03: "00000000-0000-4000-8000-000000002003",
    s04: "00000000-0000-4000-8000-000000002004",
    s05: "00000000-0000-4000-8000-000000002005",
    s06: "00000000-0000-4000-8000-000000002006",
    s07: "00000000-0000-4000-8000-000000002007",
  },
  cases: {
    s01: "00000000-0000-4000-8000-000000003001",
    s02: "00000000-0000-4000-8000-000000003002",
    s03: "00000000-0000-4000-8000-000000003003",
    s04: "00000000-0000-4000-8000-000000003004",
    s05: "00000000-0000-4000-8000-000000003005",
    s06: "00000000-0000-4000-8000-000000003006",
    s07: "00000000-0000-4000-8000-000000003007",
  },
} as const;

const now = new Date();

const daysAgo = (days: number) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
};

async function main() {
  console.log("🌱 Starting deterministic Revenue Recovery seed...");

  /*
   * --------------------------------------------------------------------------
   * 1. Merchants
   * --------------------------------------------------------------------------
   */

  const primaryMerchant = await prisma.merchant.upsert({
    where: { id: DEMO.merchants.primary },
    update: {
      name: "Acme Commerce",
      status: MerchantStatus.ACTIVE,
      defaultCurrency: "INR",
    },
    create: {
      id: DEMO.merchants.primary,
      name: "Acme Commerce",
      status: MerchantStatus.ACTIVE,
      defaultCurrency: "INR",
    },
  });

  const secondaryMerchant = await prisma.merchant.upsert({
    where: { id: DEMO.merchants.secondary },
    update: {
      name: "Nova Subscriptions",
      status: MerchantStatus.ACTIVE,
      defaultCurrency: "INR",
    },
    create: {
      id: DEMO.merchants.secondary,
      name: "Nova Subscriptions",
      status: MerchantStatus.ACTIVE,
      defaultCurrency: "INR",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 2. Customers
   * --------------------------------------------------------------------------
   */

  const customers = [
    {
      id: DEMO.customers.c001,
      merchantId: primaryMerchant.id,
      externalCustomerId: "demo-customer-001",
      email: "arjun@example.com",
      name: "Arjun Mehta",
    },
    {
      id: DEMO.customers.c002,
      merchantId: primaryMerchant.id,
      externalCustomerId: "demo-customer-002",
      email: "riya@example.com",
      name: "Riya Sharma",
    },
    {
      id: DEMO.customers.c003,
      merchantId: primaryMerchant.id,
      externalCustomerId: "demo-customer-003",
      email: "kabir@example.com",
      name: "Kabir Singh",
    },
    {
      id: DEMO.customers.c004,
      merchantId: primaryMerchant.id,
      externalCustomerId: "demo-customer-004",
      email: "ananya@example.com",
      name: "Ananya Rao",
    },
    {
      id: DEMO.customers.c005,
      merchantId: secondaryMerchant.id,
      externalCustomerId: "demo-customer-005",
      email: "vikram@example.com",
      name: "Vikram Patel",
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: {
        merchantId_externalCustomerId: {
          merchantId: customer.merchantId,
          externalCustomerId: customer.externalCustomerId,
        },
      },
      update: {
        email: customer.email,
        name: customer.name,
      },
      create: customer,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 3. Policies
   * --------------------------------------------------------------------------
   */

  const policies = [
    {
      merchantId: primaryMerchant.id,
      name: "Standard Payment Retry",
      actionType: RecoveryActionType.RETRY_PAYMENT,
      maxAmount: "10000.00",
      maxAttempts: 2,
      cooldownSeconds: 3600,
      configuration: {
        allowedPaymentMethods: ["CARD", "UPI"],
      },
    },
    {
      merchantId: primaryMerchant.id,
      name: "Payment Method Update",
      actionType: RecoveryActionType.REQUEST_PAYMENT_METHOD_UPDATE,
      maxAmount: "25000.00",
      maxAttempts: 1,
      cooldownSeconds: 86400,
      configuration: {
        channels: ["EMAIL"],
      },
    },
    {
      merchantId: primaryMerchant.id,
      name: "Checkout Reminder",
      actionType: RecoveryActionType.SEND_CHECKOUT_REMINDER,
      maxAmount: "15000.00",
      maxAttempts: 2,
      cooldownSeconds: 21600,
      configuration: {
        channels: ["EMAIL", "PUSH"],
      },
    },
    {
      merchantId: primaryMerchant.id,
      name: "Recovery Incentive",
      actionType: RecoveryActionType.OFFER_RECOVERY_INCENTIVE,
      maxAmount: "5000.00",
      maxAttempts: 1,
      cooldownSeconds: 86400,
      configuration: {
        maximumDiscountPercent: 10,
      },
    },
    {
      merchantId: secondaryMerchant.id,
      name: "Subscription Reminder",
      actionType: RecoveryActionType.SEND_PAYMENT_REMINDER,
      maxAmount: "20000.00",
      maxAttempts: 2,
      cooldownSeconds: 43200,
      configuration: {
        channels: ["EMAIL"],
      },
    },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: {
        merchantId_actionType: {
          merchantId: policy.merchantId,
          actionType: policy.actionType,
        },
      },
      update: {
        name: policy.name,
        enabled: true,
        maxAmount: policy.maxAmount,
        maxAttempts: policy.maxAttempts,
        cooldownSeconds: policy.cooldownSeconds,
        configuration: policy.configuration,
      },
      create: {
        merchantId: policy.merchantId,
        name: policy.name,
        actionType: policy.actionType,
        enabled: true,
        maxAmount: policy.maxAmount,
        maxAttempts: policy.maxAttempts,
        cooldownSeconds: policy.cooldownSeconds,
        configuration: policy.configuration,
      },
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 4. Transactions
   * --------------------------------------------------------------------------
   */

  const transactionData = [
    {
      id: DEMO.transactions.s01,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c001,
      externalTransactionId: "demo-txn-s01",
      amount: "2499.00",
      currency: "INR",
      status: TransactionStatus.FAILED,
      paymentMethod: PaymentMethod.CARD,
      failureCode: "BANK_TIMEOUT",
      failureReason: "Issuer response timed out",
      occurredAt: daysAgo(1),
    },
    {
      id: DEMO.transactions.s02,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c002,
      externalTransactionId: "demo-txn-s02",
      amount: "5499.00",
      currency: "INR",
      status: TransactionStatus.FAILED,
      paymentMethod: PaymentMethod.UPI,
      failureCode: "UPI_TIMEOUT",
      failureReason: "UPI payment timed out",
      occurredAt: daysAgo(2),
    },
    {
      id: DEMO.transactions.s03,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c003,
      externalTransactionId: "demo-txn-s03",
      amount: "8999.00",
      currency: "INR",
      status: TransactionStatus.FAILED,
      paymentMethod: PaymentMethod.CARD,
      failureCode: "CARD_EXPIRED",
      failureReason: "Customer card has expired",
      occurredAt: daysAgo(3),
    },
    {
      id: DEMO.transactions.s07,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c004,
      externalTransactionId: "demo-txn-s07",
      amount: "3999.00",
      currency: "INR",
      status: TransactionStatus.FAILED,
      paymentMethod: PaymentMethod.CARD,
      failureCode: "INSUFFICIENT_FUNDS",
      failureReason: "Insufficient funds",
      occurredAt: daysAgo(4),
    },
  ];

  for (const transaction of transactionData) {
    await prisma.transaction.upsert({
      where: {
        merchantId_externalTransactionId: {
          merchantId: transaction.merchantId,
          externalTransactionId: transaction.externalTransactionId,
        },
      },
      update: {
        amount: transaction.amount,
        status: transaction.status,
        failureCode: transaction.failureCode,
        failureReason: transaction.failureReason,
        occurredAt: transaction.occurredAt,
      },
      create: transaction,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 5. Revenue events
   * --------------------------------------------------------------------------
   */

  const eventData = [
    {
      id: DEMO.events.s01,
      merchantId: primaryMerchant.id,
      transactionId: DEMO.transactions.s01,
      customerId: DEMO.customers.c001,
      eventType: RevenueEventType.PAYMENT_FAILED,
      externalEventId: "demo-event-s01",
      payload: {
        scenario: "S01",
        failureCode: "BANK_TIMEOUT",
      },
      occurredAt: daysAgo(1),
    },
    {
      id: DEMO.events.s02,
      merchantId: primaryMerchant.id,
      transactionId: DEMO.transactions.s02,
      customerId: DEMO.customers.c002,
      eventType: RevenueEventType.PAYMENT_FAILED,
      externalEventId: "demo-event-s02",
      payload: {
        scenario: "S02",
        failureCode: "UPI_TIMEOUT",
      },
      occurredAt: daysAgo(2),
    },
    {
      id: DEMO.events.s03,
      merchantId: primaryMerchant.id,
      transactionId: DEMO.transactions.s03,
      customerId: DEMO.customers.c003,
      eventType: RevenueEventType.PAYMENT_FAILED,
      externalEventId: "demo-event-s03",
      payload: {
        scenario: "S03",
        failureCode: "CARD_EXPIRED",
      },
      occurredAt: daysAgo(3),
    },
    {
      id: DEMO.events.s04,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c001,
      eventType: RevenueEventType.CHECKOUT_ABANDONED,
      externalEventId: "demo-event-s04",
      payload: {
        scenario: "S04",
        checkoutValue: 1499,
      },
      occurredAt: daysAgo(4),
    },
    {
      id: DEMO.events.s05,
      merchantId: secondaryMerchant.id,
      customerId: DEMO.customers.c005,
      eventType: RevenueEventType.SUBSCRIPTION_PAYMENT_FAILED,
      externalEventId: "demo-event-s05",
      payload: {
        scenario: "S05",
        subscriptionPlan: "PRO",
      },
      occurredAt: daysAgo(5),
    },
    {
      id: DEMO.events.s06,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c004,
      eventType: RevenueEventType.PAYMENT_FAILED,
      externalEventId: "demo-event-s06",
      payload: {
        scenario: "S06",
        risk: "HIGH",
      },
      occurredAt: daysAgo(6),
    },
    {
      id: DEMO.events.s07,
      merchantId: primaryMerchant.id,
      transactionId: DEMO.transactions.s07,
      customerId: DEMO.customers.c004,
      eventType: RevenueEventType.PAYMENT_FAILED,
      externalEventId: "demo-event-s07",
      payload: {
        scenario: "S07",
        failureCode: "INSUFFICIENT_FUNDS",
      },
      occurredAt: daysAgo(4),
    },
  ];

  for (const event of eventData) {
    await prisma.revenueEvent.upsert({
      where: {
        merchantId_externalEventId: {
          merchantId: event.merchantId,
          externalEventId: event.externalEventId,
        },
      },
      update: {
        transactionId: event.transactionId,
        customerId: event.customerId,
        eventType: event.eventType,
        payload: event.payload,
        occurredAt: event.occurredAt,
      },
      create: event,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 6. Recovery cases
   * --------------------------------------------------------------------------
   */

  const cases = [
    {
      id: DEMO.cases.s01,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c001,
      transactionId: DEMO.transactions.s01,
      revenueEventId: DEMO.events.s01,
      caseType: RecoveryCaseType.FAILED_PAYMENT,
      status: RecoveryCaseStatus.RECOVERED,
      priority: Priority.HIGH,
      riskLevel: RiskLevel.LOW,
      estimatedRecovery: "2499.00",
      currency: "INR",
      openedAt: daysAgo(1),
      closedAt: daysAgo(0),
    },
    {
      id: DEMO.cases.s02,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c002,
      transactionId: DEMO.transactions.s02,
      revenueEventId: DEMO.events.s02,
      caseType: RecoveryCaseType.FAILED_PAYMENT,
      status: RecoveryCaseStatus.FAILED,
      priority: Priority.HIGH,
      riskLevel: RiskLevel.MEDIUM,
      estimatedRecovery: "5499.00",
      currency: "INR",
      openedAt: daysAgo(2),
      closedAt: daysAgo(1),
    },
    {
      id: DEMO.cases.s03,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c003,
      transactionId: DEMO.transactions.s03,
      revenueEventId: DEMO.events.s03,
      caseType: RecoveryCaseType.FAILED_PAYMENT,
      status: RecoveryCaseStatus.RECOVERED,
      priority: Priority.MEDIUM,
      riskLevel: RiskLevel.LOW,
      estimatedRecovery: "8999.00",
      currency: "INR",
      openedAt: daysAgo(3),
      closedAt: daysAgo(2),
    },
    {
      id: DEMO.cases.s04,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c001,
      revenueEventId: DEMO.events.s04,
      caseType: RecoveryCaseType.CHECKOUT_ABANDONMENT,
      status: RecoveryCaseStatus.RECOVERED,
      priority: Priority.MEDIUM,
      riskLevel: RiskLevel.LOW,
      estimatedRecovery: "1499.00",
      currency: "INR",
      openedAt: daysAgo(4),
      closedAt: daysAgo(3),
    },
    {
      id: DEMO.cases.s05,
      merchantId: secondaryMerchant.id,
      customerId: DEMO.customers.c005,
      revenueEventId: DEMO.events.s05,
      caseType: RecoveryCaseType.SUBSCRIPTION_FAILURE,
      status: RecoveryCaseStatus.FAILED,
      priority: Priority.HIGH,
      riskLevel: RiskLevel.MEDIUM,
      estimatedRecovery: "1999.00",
      currency: "INR",
      openedAt: daysAgo(5),
      closedAt: daysAgo(4),
    },
    {
      id: DEMO.cases.s06,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c004,
      revenueEventId: DEMO.events.s06,
      caseType: RecoveryCaseType.FAILED_PAYMENT,
      status: RecoveryCaseStatus.CLOSED,
      priority: Priority.CRITICAL,
      riskLevel: RiskLevel.HIGH,
      estimatedRecovery: "12999.00",
      currency: "INR",
      openedAt: daysAgo(6),
      closedAt: daysAgo(6),
    },
    {
      id: DEMO.cases.s07,
      merchantId: primaryMerchant.id,
      customerId: DEMO.customers.c004,
      transactionId: DEMO.transactions.s07,
      revenueEventId: DEMO.events.s07,
      caseType: RecoveryCaseType.FAILED_PAYMENT,
      status: RecoveryCaseStatus.RECOVERED,
      priority: Priority.HIGH,
      riskLevel: RiskLevel.MEDIUM,
      estimatedRecovery: "3999.00",
      currency: "INR",
      openedAt: daysAgo(4),
      closedAt: daysAgo(2),
    },
  ];

  for (const recoveryCase of cases) {
    await prisma.recoveryCase.upsert({
      where: { id: recoveryCase.id },
      update: recoveryCase,
      create: recoveryCase,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 7. AI strategy decisions
   * --------------------------------------------------------------------------
   */

  const decisions = [
    {
      id: "00000000-0000-4000-8000-000000004001",
      recoveryCaseId: DEMO.cases.s01,
      decision: RecoveryStrategy.RETRY_PAYMENT,
      confidence: "0.9400",
      reason: "The issuer timeout is transient and the payment is within the retry policy.",
      evidence: {
        failureCode: "BANK_TIMEOUT",
        paymentMethod: "CARD",
        amount: 2499,
      },
      expectedRecovery: "2499.00",
      riskLevel: RiskLevel.LOW,
      tool: "recovery-policy-engine",
      parameters: {
        attempt: 1,
      },
      model: "recovery-demo-v1",
      promptVersion: "v1",
      status: DecisionStatus.VALIDATED,
    },
    {
      id: "00000000-0000-4000-8000-000000004002",
      recoveryCaseId: DEMO.cases.s02,
      decision: RecoveryStrategy.RETRY_PAYMENT,
      confidence: "0.8700",
      reason: "The timeout is retryable, but the customer has already experienced a failed payment attempt.",
      evidence: {
        failureCode: "UPI_TIMEOUT",
        paymentMethod: "UPI",
        amount: 5499,
      },
      expectedRecovery: "5499.00",
      riskLevel: RiskLevel.MEDIUM,
      tool: "recovery-policy-engine",
      parameters: {
        attempt: 1,
      },
      model: "recovery-demo-v1",
      promptVersion: "v1",
      status: DecisionStatus.VALIDATED,
    },
    {
      id: "00000000-0000-4000-8000-000000004003",
      recoveryCaseId: DEMO.cases.s03,
      decision: RecoveryStrategy.REQUEST_PAYMENT_METHOD_UPDATE,
      confidence: "0.9700",
      reason: "The card is expired, so retrying the same payment instrument is unlikely to succeed.",
      evidence: {
        failureCode: "CARD_EXPIRED",
        paymentMethod: "CARD",
        amount: 8999,
      },
      expectedRecovery: "8999.00",
      riskLevel: RiskLevel.LOW,
      tool: "recovery-policy-engine",
      parameters: {
        channel: "EMAIL",
      },
      model: "recovery-demo-v1",
      promptVersion: "v1",
      status: DecisionStatus.VALIDATED,
    },
    {
      id: "00000000-0000-4000-8000-000000004004",
      recoveryCaseId: DEMO.cases.s04,
      decision: RecoveryStrategy.SEND_CHECKOUT_REMINDER,
      confidence: "0.9100",
      reason: "The checkout was abandoned without a payment failure, making a reminder the lowest-friction recovery action.",
      evidence: {
        eventType: "CHECKOUT_ABANDONED",
        checkoutValue: 1499,
      },
      expectedRecovery: "1499.00",
      riskLevel: RiskLevel.LOW,
      tool: "recovery-policy-engine",
      parameters: {
        channel: "EMAIL",
      },
      model: "recovery-demo-v1",
      promptVersion: "v1",
      status: DecisionStatus.VALIDATED,
    },
    {
      id: "00000000-0000-4000-8000-000000004005",
      recoveryCaseId: DEMO.cases.s05,
      decision: RecoveryStrategy.SEND_PAYMENT_REMINDER,
      confidence: "0.8200",
      reason: "A payment reminder is preferred for a subscription failure before attempting more aggressive recovery actions.",
      evidence: {
        eventType: "SUBSCRIPTION_PAYMENT_FAILED",
        subscriptionPlan: "PRO",
      },
      expectedRecovery: "1999.00",
      riskLevel: RiskLevel.MEDIUM,
      tool: "recovery-policy-engine",
      parameters: {
        channel: "EMAIL",
      },
      model: "recovery-demo-v1",
      promptVersion: "v1",
      status: DecisionStatus.VALIDATED,
    },
    {
      id: "00000000-0000-4000-8000-000000004006",
      recoveryCaseId: DEMO.cases.s06,
      decision: RecoveryStrategy.NO_ACTION,
      confidence: "0.9900",
      reason: "The recovery opportunity is high risk and should not trigger an automated financial action.",
      evidence: {
        riskLevel: "HIGH",
        amount: 12999,
      },
      expectedRecovery: "0.00",
      riskLevel: RiskLevel.HIGH,
      tool: "recovery-policy-engine",
      parameters: {
        reason: "high-risk",
      },
      model: "recovery-demo-v1",
      promptVersion: "v1",
      status: DecisionStatus.VALIDATED,
    },
    {
      id: "00000000-0000-4000-8000-000000004007",
      recoveryCaseId: DEMO.cases.s07,
      decision: RecoveryStrategy.OFFER_RECOVERY_INCENTIVE,
      confidence: "0.7600",
      reason: "A limited incentive is permitted by policy and may recover part of the outstanding amount.",
      evidence: {
        failureCode: "INSUFFICIENT_FUNDS",
        amount: 3999,
      },
      expectedRecovery: "3599.10",
      riskLevel: RiskLevel.MEDIUM,
      tool: "recovery-policy-engine",
      parameters: {
        discountPercent: 10,
      },
      model: "recovery-demo-v1",
      promptVersion: "v1",
      status: DecisionStatus.VALIDATED,
    },
  ];

  for (const decision of decisions) {
    await prisma.aIStrategyDecision.upsert({
      where: { id: decision.id },
      update: decision,
      create: decision,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 8. Recovery actions
   * --------------------------------------------------------------------------
   */

  const actions = [
    {
      id: "00000000-0000-4000-8000-000000005001",
      recoveryCaseId: DEMO.cases.s01,
      strategyDecisionId: decisions[0].id,
      actionType: RecoveryActionType.RETRY_PAYMENT,
      status: RecoveryActionStatus.SUCCEEDED,
      idempotencyKey: "demo-action-s01",
      parameters: { attempt: 1 },
      executedAt: daysAgo(1),
      completedAt: daysAgo(1),
    },
    {
      id: "00000000-0000-4000-8000-000000005002",
      recoveryCaseId: DEMO.cases.s02,
      strategyDecisionId: decisions[1].id,
      actionType: RecoveryActionType.RETRY_PAYMENT,
      status: RecoveryActionStatus.FAILED,
      idempotencyKey: "demo-action-s02",
      parameters: { attempt: 1 },
      executedAt: daysAgo(2),
      completedAt: daysAgo(1),
      errorCode: "PAYMENT_DECLINED",
      errorMessage: "Retry was declined by the payment processor.",
    },
    {
      id: "00000000-0000-4000-8000-000000005003",
      recoveryCaseId: DEMO.cases.s03,
      strategyDecisionId: decisions[2].id,
      actionType: RecoveryActionType.REQUEST_PAYMENT_METHOD_UPDATE,
      status: RecoveryActionStatus.SUCCEEDED,
      idempotencyKey: "demo-action-s03",
      parameters: { channel: "EMAIL" },
      executedAt: daysAgo(3),
      completedAt: daysAgo(2),
    },
    {
      id: "00000000-0000-4000-8000-000000005004",
      recoveryCaseId: DEMO.cases.s04,
      strategyDecisionId: decisions[3].id,
      actionType: RecoveryActionType.SEND_CHECKOUT_REMINDER,
      status: RecoveryActionStatus.SUCCEEDED,
      idempotencyKey: "demo-action-s04",
      parameters: { channel: "EMAIL" },
      executedAt: daysAgo(4),
      completedAt: daysAgo(3),
    },
    {
      id: "00000000-0000-4000-8000-000000005005",
      recoveryCaseId: DEMO.cases.s05,
      strategyDecisionId: decisions[4].id,
      actionType: RecoveryActionType.SEND_PAYMENT_REMINDER,
      status: RecoveryActionStatus.SUCCEEDED,
      idempotencyKey: "demo-action-s05",
      parameters: { channel: "EMAIL" },
      executedAt: daysAgo(5),
      completedAt: daysAgo(4),
    },
    {
      id: "00000000-0000-4000-8000-000000005006",
      recoveryCaseId: DEMO.cases.s06,
      strategyDecisionId: decisions[5].id,
      actionType: RecoveryActionType.NO_ACTION,
      status: RecoveryActionStatus.SKIPPED,
      idempotencyKey: "demo-action-s06",
      parameters: { reason: "high-risk" },
    },
    {
      id: "00000000-0000-4000-8000-000000005007",
      recoveryCaseId: DEMO.cases.s07,
      strategyDecisionId: decisions[6].id,
      actionType: RecoveryActionType.OFFER_RECOVERY_INCENTIVE,
      status: RecoveryActionStatus.SUCCEEDED,
      idempotencyKey: "demo-action-s07",
      parameters: { discountPercent: 10 },
      executedAt: daysAgo(4),
      completedAt: daysAgo(2),
    },
  ];

  for (const action of actions) {
    await prisma.recoveryAction.upsert({
      where: { id: action.id },
      update: action,
      create: action,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 9. Outcomes
   * --------------------------------------------------------------------------
   */

  const outcomes = [
    {
      id: "00000000-0000-4000-8000-000000006001",
      recoveryCaseId: DEMO.cases.s01,
      recoveryActionId: actions[0].id,
      status: OutcomeStatus.SUCCESS,
      recoveredAmount: "2499.00",
      currency: "INR",
      occurredAt: daysAgo(1),
    },
    {
      id: "00000000-0000-4000-8000-000000006002",
      recoveryCaseId: DEMO.cases.s02,
      recoveryActionId: actions[1].id,
      status: OutcomeStatus.FAILED,
      failureReason: "Payment processor declined the retry.",
      recoveredAmount: "0.00",
      currency: "INR",
      occurredAt: daysAgo(1),
    },
    {
      id: "00000000-0000-4000-8000-000000006003",
      recoveryCaseId: DEMO.cases.s03,
      recoveryActionId: actions[2].id,
      status: OutcomeStatus.SUCCESS,
      recoveredAmount: "8999.00",
      currency: "INR",
      occurredAt: daysAgo(2),
    },
    {
      id: "00000000-0000-4000-8000-000000006004",
      recoveryCaseId: DEMO.cases.s04,
      recoveryActionId: actions[3].id,
      status: OutcomeStatus.SUCCESS,
      recoveredAmount: "1499.00",
      currency: "INR",
      occurredAt: daysAgo(3),
    },
    {
      id: "00000000-0000-4000-8000-000000006005",
      recoveryCaseId: DEMO.cases.s05,
      recoveryActionId: actions[4].id,
      status: OutcomeStatus.NO_CHANGE,
      recoveredAmount: "0.00",
      currency: "INR",
      occurredAt: daysAgo(4),
    },
    {
      id: "00000000-0000-4000-8000-000000006006",
      recoveryCaseId: DEMO.cases.s06,
      recoveryActionId: actions[5].id,
      status: OutcomeStatus.NO_CHANGE,
      recoveredAmount: "0.00",
      currency: "INR",
      occurredAt: daysAgo(6),
    },
    {
      id: "00000000-0000-4000-8000-000000006007",
      recoveryCaseId: DEMO.cases.s07,
      recoveryActionId: actions[6].id,
      status: OutcomeStatus.PARTIAL_SUCCESS,
      recoveredAmount: "3599.10",
      currency: "INR",
      occurredAt: daysAgo(2),
    },
  ];

  for (const outcome of outcomes) {
    await prisma.outcome.upsert({
      where: { id: outcome.id },
      update: outcome,
      create: outcome,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 10. Revenue attribution
   * --------------------------------------------------------------------------
   */

  const attributions = [
    {
      id: "00000000-0000-4000-8000-000000007001",
      recoveryCaseId: DEMO.cases.s01,
      outcomeId: outcomes[0].id,
      amount: "2499.00",
      currency: "INR",
      attributionType: AttributionType.DIRECT,
      attributedAt: daysAgo(1),
    },
    {
      id: "00000000-0000-4000-8000-000000007002",
      recoveryCaseId: DEMO.cases.s03,
      outcomeId: outcomes[2].id,
      amount: "8999.00",
      currency: "INR",
      attributionType: AttributionType.DIRECT,
      attributedAt: daysAgo(2),
    },
    {
      id: "00000000-0000-4000-8000-000000007003",
      recoveryCaseId: DEMO.cases.s04,
      outcomeId: outcomes[3].id,
      amount: "1499.00",
      currency: "INR",
      attributionType: AttributionType.ASSISTED,
      attributedAt: daysAgo(3),
    },
    {
      id: "00000000-0000-4000-8000-000000007004",
      recoveryCaseId: DEMO.cases.s07,
      outcomeId: outcomes[6].id,
      amount: "3599.10",
      currency: "INR",
      attributionType: AttributionType.DIRECT,
      attributedAt: daysAgo(2),
    },
  ];

  for (const attribution of attributions) {
    await prisma.revenueAttribution.upsert({
      where: { id: attribution.id },
      update: attribution,
      create: attribution,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * 11. Audit events
   * --------------------------------------------------------------------------
   */

  const auditEvents = [
    {
      id: "00000000-0000-4000-8000-000000008001",
      merchantId: primaryMerchant.id,
      recoveryCaseId: DEMO.cases.s01,
      eventType: "RECOVERY_CASE_CREATED",
      actorType: ActorType.SYSTEM,
      metadata: { scenario: "S01" },
    },
    {
      id: "00000000-0000-4000-8000-000000008002",
      merchantId: primaryMerchant.id,
      recoveryCaseId: DEMO.cases.s01,
      eventType: "AI_DECISION_CREATED",
      actorType: ActorType.AI,
      metadata: {
        strategy: "RETRY_PAYMENT",
        confidence: 0.94,
      },
    },
    {
      id: "00000000-0000-4000-8000-000000008003",
      merchantId: primaryMerchant.id,
      recoveryCaseId: DEMO.cases.s01,
      eventType: "RECOVERY_ACTION_SUCCEEDED",
      actorType: ActorType.SYSTEM,
      metadata: {
        action: "RETRY_PAYMENT",
        recoveredAmount: 2499,
      },
    },
    {
      id: "00000000-0000-4000-8000-000000008004",
      merchantId: primaryMerchant.id,
      recoveryCaseId: DEMO.cases.s03,
      eventType: "AI_DECISION_CREATED",
      actorType: ActorType.AI,
      metadata: {
        strategy: "REQUEST_PAYMENT_METHOD_UPDATE",
        confidence: 0.97,
      },
    },
    {
      id: "00000000-0000-4000-8000-000000008005",
      merchantId: primaryMerchant.id,
      recoveryCaseId: DEMO.cases.s06,
      eventType: "RECOVERY_ACTION_SKIPPED",
      actorType: ActorType.AI,
      metadata: {
        reason: "high-risk",
      },
    },
  ];

  for (const event of auditEvents) {
    await prisma.auditEvent.upsert({
      where: { id: event.id },
      update: {
        eventType: event.eventType,
        actorType: event.actorType,
        metadata: event.metadata,
      },
      create: event,
    });
  }

  /*
   * --------------------------------------------------------------------------
   * Verification summary
   * --------------------------------------------------------------------------
   */

  const [
    merchantCount,
    customerCount,
    transactionCount,
    eventCount,
    caseCount,
    decisionCount,
    actionCount,
    outcomeCount,
    attributionCount,
    policyCount,
    auditCount,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.customer.count(),
    prisma.transaction.count(),
    prisma.revenueEvent.count(),
    prisma.recoveryCase.count(),
    prisma.aIStrategyDecision.count(),
    prisma.recoveryAction.count(),
    prisma.outcome.count(),
    prisma.revenueAttribution.count(),
    prisma.policy.count(),
    prisma.auditEvent.count(),
  ]);

  console.log("");
  console.log("✅ Seed completed successfully.");
  console.log("");
  console.log("Records:");
  console.log(`  Merchants:           ${merchantCount}`);
  console.log(`  Customers:           ${customerCount}`);
  console.log(`  Transactions:        ${transactionCount}`);
  console.log(`  Revenue events:      ${eventCount}`);
  console.log(`  Recovery cases:      ${caseCount}`);
  console.log(`  AI decisions:        ${decisionCount}`);
  console.log(`  Recovery actions:    ${actionCount}`);
  console.log(`  Outcomes:            ${outcomeCount}`);
  console.log(`  Revenue attribution: ${attributionCount}`);
  console.log(`  Policies:            ${policyCount}`);
  console.log(`  Audit events:        ${auditCount}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });