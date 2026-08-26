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
   * 1. Fetch RecoveryAction.
   */
  const action =
    await prisma.recoveryAction.findUnique({
      where: {
        id: recoveryActionId,
      },
      include: {
        recoveryCase: {
          include: {
            revenueEvent: true,
          },
        },
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
   * Terminal actions must never execute again.
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
        recoveryCase: {
          include: {
            revenueEvent: true,
          },
        },
      },
    });

  try {
    /*
     * 5. Execute recovery action.
     *
     * This is currently a deterministic mock
     * payment provider.
     *
     * The test scenario is carried by the
     * RevenueEvent payload.
     */
    const revenueEvent =
      executingAction.recoveryCase
        .revenueEvent;

    const payload =
      revenueEvent?.payload;

    const scenario =
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
            .scenario
        : undefined;

    /*
     * Explicit failure scenario.
     */
    const shouldFail =
      scenario ===
      "EXECUTION_FAILURE";

    const executionResult = shouldFail
      ? {
          success: false,
          message:
            "Mock payment provider rejected the retry",
        }
      : {
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
          recoveryCase: {
            include: {
              revenueEvent: true,
            },
          },
        },
      });

    /*
     * 7. Find existing Outcome.
     *
     * Protects against duplicate execution.
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
     * 9. RecoveryCase lifecycle.
     *
     * SUCCESS:
     *   RECOVERED
     *
     * FAILURE:
     *   remains OPEN
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
          include: {
            revenueEvent: true,
          },
        });

      finalAction = {
        ...completedAction,
        recoveryCase: updatedCase,
      };
    } else {
      /*
       * Failed recovery should remain OPEN.
       *
       * Do not close the case.
       */
      const openCase =
        await prisma.recoveryCase.update({
          where: {
            id: action.recoveryCaseId,
          },
          data: {
            status:
              RecoveryCaseStatus.OPEN,

            closedAt: null,
          },
          include: {
            revenueEvent: true,
          },
        });

      finalAction = {
        ...completedAction,
        recoveryCase: openCase,
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
     * 11. Unexpected execution error.
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

    /*
     * Ensure the case remains recoverable/open.
     */
    await prisma.recoveryCase.update({
      where: {
        id: action.recoveryCaseId,
      },
      data: {
        status:
          RecoveryCaseStatus.OPEN,

        closedAt: null,
      },
    });

    throw error;
  }
};