import { prisma } from "../../lib/prisma";
import {
  RecoveryActionStatus,
  OutcomeStatus,
} from "@prisma/client";

export const executeRecoveryAction = async (
  recoveryActionId: string,
) => {
  /*
   * 1. Fetch the action
   */
  const action = await prisma.recoveryAction.findUnique({
    where: {
      id: recoveryActionId,
    },
  });

  if (!action) {
    throw new Error("Recovery action not found");
  }

  /*
   * 2. Idempotency:
   *    If the action has already completed, return it.
   */
  if (
    action.status === RecoveryActionStatus.SUCCEEDED ||
    action.status === RecoveryActionStatus.FAILED ||
    action.status === RecoveryActionStatus.SKIPPED
  ) {
    return action;
  }

  /*
   * 3. Only PENDING actions can start execution.
   */
  if (action.status !== RecoveryActionStatus.PENDING) {
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
        status: RecoveryActionStatus.EXECUTING,
        executedAt: new Date(),
      },
    });

  try {
    /*
     * 5. Mock provider execution.
     *
     * For the MVP we simulate successful execution.
     * No real payment is attempted.
     */
    const executionResult = {
      success: true,
      message: `Mock execution completed for ${action.actionType}`,
    };

    /*
     * 6. Mark action as SUCCEEDED.
     */
    const completedAction =
      await prisma.recoveryAction.update({
        where: {
          id: executingAction.id,
        },
        data: {
          status: executionResult.success
            ? RecoveryActionStatus.SUCCEEDED
            : RecoveryActionStatus.FAILED,
          completedAt: new Date(),
          errorCode: executionResult.success
            ? null
            : "EXECUTION_FAILED",
          errorMessage: executionResult.success
            ? null
            : executionResult.message,
        },
      });

    /*
     * 7. Create Outcome.
     *
     * One RecoveryAction can have only one Outcome
     * because recoveryActionId is unique in the schema.
     */
    const existingOutcome = await prisma.outcome.findUnique({
      where: {
        recoveryActionId: action.id,
      },
    });

    if (!existingOutcome) {
      await prisma.outcome.create({
        data: {
          recoveryCaseId: action.recoveryCaseId,
          recoveryActionId: action.id,
          status: executionResult.success
            ? OutcomeStatus.SUCCESS
            : OutcomeStatus.FAILED,
          failureReason: executionResult.success
            ? null
            : executionResult.message,
          recoveredAmount: null,
          currency: "INR",
          occurredAt: new Date(),
        },
      });
    }

    return completedAction;
  } catch (error) {
    /*
     * 8. Mark action as FAILED if execution itself throws.
     */
    await prisma.recoveryAction.update({
      where: {
        id: action.id,
      },
      data: {
        status: RecoveryActionStatus.FAILED,
        completedAt: new Date(),
        errorCode: "EXECUTION_ERROR",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown execution error",
      },
    });

    throw error;
  }
};
