import { prisma } from "../../lib/prisma";
import {
  RecoveryActionStatus,
  OutcomeStatus,
  RecoveryCaseStatus,
} from "@prisma/client";

export const executeRecoveryAction = async (
  recoveryActionId: string,
) => {
  /*
   * 1. Fetch the recovery action.
   */
  const action =
    await prisma.recoveryAction.findUnique({
      where: {
        id: recoveryActionId,
      },
      include: {
        recoveryCase: true,
      },
    });

  if (!action) {
    throw new Error(
      "Recovery action not found",
    );
  }

  /*
   * 2. Idempotency.
   *
   * If execution has already completed,
   * return the existing outcome.
   */
  if (
    action.status ===
      RecoveryActionStatus.SUCCEEDED ||
    action.status ===
      RecoveryActionStatus.FAILED ||
    action.status ===
      RecoveryActionStatus.SKIPPED
  ) {
    const outcome =
      await prisma.outcome.findUnique({
        where: {
          recoveryActionId: action.id,
        },
      });

    return {
      action,
      outcome,
    };
  }

  /*
   * 3. Only PENDING actions can execute.
   */
  if (
    action.status !==
    RecoveryActionStatus.PENDING
  ) {
    throw new Error(
      `Recovery action cannot be executed from status: ${action.status}`,
    );
  }

  /*
   * 4. Mark action as EXECUTING.
   */
  const executingAction =
    await prisma.recoveryAction.update({
      where: {
        id: action.id,
      },
      data: {
        status:
          RecoveryActionStatus.EXECUTING,
        executedAt: new Date(),
      },
      include: {
        recoveryCase: true,
      },
    });

  try {
    /*
     * 5. Execute recovery action.
     *
     * Currently this is a deterministic mock
     * provider. Real payment-provider integration
     * will be added later.
     */
    const executionResult = {
      success: true,
      message: `Mock execution completed for ${action.actionType}`,
    };

    /*
     * 6. Update RecoveryAction.
     */
    const completedAction =
      await prisma.recoveryAction.update({
        where: {
          id: executingAction.id,
        },
        data: {
          status:
            executionResult.success
              ? RecoveryActionStatus.SUCCEEDED
              : RecoveryActionStatus.FAILED,

          completedAt: new Date(),

          errorCode:
            executionResult.success
              ? null
              : "EXECUTION_FAILED",

          errorMessage:
            executionResult.success
              ? null
              : executionResult.message,
        },
        include: {
          recoveryCase: true,
        },
      });

    /*
     * 7. Find existing outcome.
     */
    let outcome =
      await prisma.outcome.findUnique({
        where: {
          recoveryActionId:
            action.id,
        },
      });

    /*
     * 8. Create Outcome.
     */
    if (!outcome) {
      outcome =
        await prisma.outcome.create({
          data: {
            recoveryCaseId:
              action.recoveryCaseId,

            recoveryActionId:
              action.id,

            status:
              executionResult.success
                ? OutcomeStatus.SUCCESS
                : OutcomeStatus.FAILED,

            failureReason:
              executionResult.success
                ? null
                : executionResult.message,

            recoveredAmount:
              executionResult.success
                ? action.recoveryCase
                    .estimatedRecovery
                : null,

            currency:
              action.recoveryCase.currency,

            occurredAt: new Date(),
          },
        });
    }

    /*
     * 9. Successful recovery updates
     *    the RecoveryCase lifecycle.
     */
    let finalAction =
      completedAction;

    if (
      outcome.status ===
      OutcomeStatus.SUCCESS
    ) {
      const updatedCase =
        await prisma.recoveryCase.update({
          where: {
            id: action.recoveryCaseId,
          },
          data: {
            status:
              RecoveryCaseStatus.RECOVERED,

            closedAt: new Date(),
          },
        });

      /*
       * Keep the returned action's
       * recoveryCase synchronized.
       */
      finalAction = {
        ...completedAction,
        recoveryCase: updatedCase,
      };
    }

    /*
     * 10. Return action + outcome.
     */
    return {
      action: finalAction,
      outcome,
    };
  } catch (error) {
    /*
     * 11. Mark action as failed if execution
     *     throws unexpectedly.
     */
    await prisma.recoveryAction.update({
      where: {
        id: action.id,
      },
      data: {
        status:
          RecoveryActionStatus.FAILED,

        completedAt: new Date(),

        errorCode:
          "EXECUTION_ERROR",

        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown execution error",
      },
    });

    throw error;
  }
};