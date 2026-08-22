/*
  Warnings:

  - A unique constraint covering the columns `[recoveryActionId]` on the table `Outcome` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[merchantId,actionType]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Outcome_recoveryActionId_key" ON "Outcome"("recoveryActionId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_merchantId_actionType_key" ON "Policy"("merchantId", "actionType");
