-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'UPI', 'NET_BANKING', 'WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "RevenueEventType" AS ENUM ('PAYMENT_FAILED', 'PAYMENT_SUCCEEDED', 'CHECKOUT_ABANDONED', 'SUBSCRIPTION_PAYMENT_FAILED', 'SUBSCRIPTION_RENEWED');

-- CreateEnum
CREATE TYPE "RecoveryCaseType" AS ENUM ('FAILED_PAYMENT', 'CHECKOUT_ABANDONMENT', 'SUBSCRIPTION_FAILURE');

-- CreateEnum
CREATE TYPE "RecoveryCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RECOVERED', 'FAILED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RecoveryStrategy" AS ENUM ('RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER', 'REQUEST_PAYMENT_METHOD_UPDATE', 'SEND_CHECKOUT_REMINDER', 'OFFER_RECOVERY_INCENTIVE', 'NO_ACTION');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('GENERATED', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecoveryActionType" AS ENUM ('RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER', 'REQUEST_PAYMENT_METHOD_UPDATE', 'SEND_CHECKOUT_REMINDER', 'OFFER_RECOVERY_INCENTIVE', 'NO_ACTION');

-- CreateEnum
CREATE TYPE "RecoveryActionStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "OutcomeStatus" AS ENUM ('SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'NO_CHANGE');

-- CreateEnum
CREATE TYPE "AttributionType" AS ENUM ('DIRECT', 'ASSISTED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('SYSTEM', 'AI', 'MERCHANT', 'ADMIN');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultCurrency" VARCHAR(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "externalCustomerId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "externalTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "failureCode" TEXT,
    "failureReason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "transactionId" TEXT,
    "customerId" TEXT,
    "eventType" "RevenueEventType" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCase" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT,
    "transactionId" TEXT,
    "revenueEventId" TEXT,
    "caseType" "RecoveryCaseType" NOT NULL,
    "status" "RecoveryCaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" "RiskLevel",
    "estimatedRecovery" DECIMAL(18,2),
    "currency" VARCHAR(3) NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIStrategyDecision" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "decision" "RecoveryStrategy" NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "expectedRecovery" DECIMAL(18,2),
    "riskLevel" "RiskLevel" NOT NULL,
    "tool" TEXT,
    "parameters" JSONB,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIStrategyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryAction" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "strategyDecisionId" TEXT,
    "actionType" "RecoveryActionType" NOT NULL,
    "status" "RecoveryActionStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "parameters" JSONB,
    "executedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actionType" "RecoveryActionType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxAmount" DECIMAL(18,2),
    "maxAttempts" INTEGER,
    "cooldownSeconds" INTEGER,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "recoveryActionId" TEXT NOT NULL,
    "status" "OutcomeStatus" NOT NULL,
    "failureReason" TEXT,
    "recoveredAmount" DECIMAL(18,2),
    "currency" VARCHAR(3) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueAttribution" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "attributionType" "AttributionType" NOT NULL,
    "attributedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "recoveryCaseId" TEXT,
    "eventType" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_merchantId_idx" ON "Customer"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_merchantId_externalCustomerId_key" ON "Customer"("merchantId", "externalCustomerId");

-- CreateIndex
CREATE INDEX "Transaction_merchantId_status_idx" ON "Transaction"("merchantId", "status");

-- CreateIndex
CREATE INDEX "Transaction_merchantId_occurredAt_idx" ON "Transaction"("merchantId", "occurredAt");

-- CreateIndex
CREATE INDEX "Transaction_customerId_idx" ON "Transaction"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_merchantId_externalTransactionId_key" ON "Transaction"("merchantId", "externalTransactionId");

-- CreateIndex
CREATE INDEX "RevenueEvent_merchantId_eventType_idx" ON "RevenueEvent"("merchantId", "eventType");

-- CreateIndex
CREATE INDEX "RevenueEvent_merchantId_occurredAt_idx" ON "RevenueEvent"("merchantId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueEvent_merchantId_externalEventId_key" ON "RevenueEvent"("merchantId", "externalEventId");

-- CreateIndex
CREATE INDEX "RecoveryCase_merchantId_status_idx" ON "RecoveryCase"("merchantId", "status");

-- CreateIndex
CREATE INDEX "RecoveryCase_merchantId_priority_idx" ON "RecoveryCase"("merchantId", "priority");

-- CreateIndex
CREATE INDEX "RecoveryCase_merchantId_createdAt_idx" ON "RecoveryCase"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "RecoveryCase_customerId_idx" ON "RecoveryCase"("customerId");

-- CreateIndex
CREATE INDEX "RecoveryCase_transactionId_idx" ON "RecoveryCase"("transactionId");

-- CreateIndex
CREATE INDEX "AIStrategyDecision_recoveryCaseId_createdAt_idx" ON "AIStrategyDecision"("recoveryCaseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAction_idempotencyKey_key" ON "RecoveryAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RecoveryAction_recoveryCaseId_idx" ON "RecoveryAction"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "RecoveryAction_status_idx" ON "RecoveryAction"("status");

-- CreateIndex
CREATE INDEX "Policy_merchantId_enabled_idx" ON "Policy"("merchantId", "enabled");

-- CreateIndex
CREATE INDEX "Outcome_recoveryCaseId_idx" ON "Outcome"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "Outcome_status_idx" ON "Outcome"("status");

-- CreateIndex
CREATE INDEX "Outcome_occurredAt_idx" ON "Outcome"("occurredAt");

-- CreateIndex
CREATE INDEX "RevenueAttribution_recoveryCaseId_idx" ON "RevenueAttribution"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "RevenueAttribution_outcomeId_idx" ON "RevenueAttribution"("outcomeId");

-- CreateIndex
CREATE INDEX "RevenueAttribution_attributedAt_idx" ON "RevenueAttribution"("attributedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_merchantId_createdAt_idx" ON "AuditEvent"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_recoveryCaseId_createdAt_idx" ON "AuditEvent"("recoveryCaseId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_revenueEventId_fkey" FOREIGN KEY ("revenueEventId") REFERENCES "RevenueEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIStrategyDecision" ADD CONSTRAINT "AIStrategyDecision_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_strategyDecisionId_fkey" FOREIGN KEY ("strategyDecisionId") REFERENCES "AIStrategyDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_recoveryActionId_fkey" FOREIGN KEY ("recoveryActionId") REFERENCES "RecoveryAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAttribution" ADD CONSTRAINT "RevenueAttribution_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAttribution" ADD CONSTRAINT "RevenueAttribution_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
