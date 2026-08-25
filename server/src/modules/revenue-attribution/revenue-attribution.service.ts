import { prisma } from "../../lib/prisma";
import { AttributionType, OutcomeStatus } from "@prisma/client";

export const createRevenueAttribution = async (
  outcomeId: string,
) => {
  /*
   * 1. Find the outcome together with its recovery case.
   */
  const outcome = await prisma.outcome.findUnique({
    where: {
      id: outcomeId,
    },
    include: {
      recoveryCase: true,
    },
  });

  if (!outcome) {
    throw new Error("Outcome not found");
  }

  /*
   * 2. Only successful outcomes can be attributed
   *    as recovered revenue.
   */
  if (outcome.status !== OutcomeStatus.SUCCESS) {
    throw new Error(
      "Revenue can only be attributed to a successful outcome",
    );
  }

  /*
   * 3. A recovered amount is required.
   */
  if (outcome.recoveredAmount === null) {
    throw new Error(
      "Outcome does not contain a recovered amount",
    );
  }

  /*
   * 4. Prevent duplicate attribution.
   */
  const existingAttribution =
    await prisma.revenueAttribution.findFirst({
      where: {
        outcomeId: outcome.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (existingAttribution) {
    return existingAttribution;
  }

  /*
   * 5. Create the revenue attribution.
   *
   * DIRECT means the recovery action directly resulted
   * in the recovered revenue.
   */
  const attribution =
    await prisma.revenueAttribution.create({
      data: {
        recoveryCaseId: outcome.recoveryCaseId,
        outcomeId: outcome.id,
        amount: outcome.recoveredAmount,
        currency: outcome.currency,
        attributionType: AttributionType.DIRECT,
        attributedAt: new Date(),
      },
    });

  /*
   * 6. Return the created attribution.
   */
  return attribution;
};