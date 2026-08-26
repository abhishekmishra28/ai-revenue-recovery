import { prisma } from "../../lib/prisma";
import {
  RecoveryActionStatus,
  OutcomeStatus,
} from "@prisma/client";

export const executeRecoveryAction = async (
  recoveryActionId: string,
) => {
  /*
   * 1. Fetch the action.
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
   * Completed actions should not execute again.
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
     * 5. Mock provider execution.
     *
     * This is intentionally deterministic
     * for the MVP.
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
     * 7. Find an existing Outcome.
     *
     * recoveryActionId is unique in the schema.
     */
    let outcome =
      await prisma.outcome.findUnique({
        where: {
          recoveryActionId:
            action.id,
        },
      });

    /*
     * 8. Create Outcome if it does not exist.
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
              action.recoveryCase
                .estimatedRecovery,

            currency:
              action.recoveryCase.currency,

            occurredAt: new Date(),
          },
        });
    }

    return {
      action: completedAction,
      outcome,
    };
  } catch (error) {
    /*
     * 9. Execution failure.
     */
    const failedAction =
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
        include: {
          recoveryCase: true,
        },
      });

    throw error;
  }
};