import { processRevenueEvent } from "../event-processing/event-processor.service";
import { generateStrategyDecision } from "../ai-strategy-engine/ai-strategy-engine.service";
import { validateStrategyDecision } from "../policy-engine/policy-engine.service";
import { createRecoveryAction } from "../recovery-action-engine/recovery-action-engine.service";
import { executeRecoveryAction } from "../action-execution/action-execution.service";

export const orchestrateRecovery = async (
  revenueEventId: string,
) => {
  /*
   * STEP 1
   * Process the revenue event.
   */
  const eventResult =
    await processRevenueEvent(
      revenueEventId,
    );

  /*
   * STEP 2
   * Stop if the event was already processed.
   */
  if (
    eventResult.status ===
    "ALREADY_PROCESSED"
  ) {
    return {
      status: "ALREADY_PROCESSED",
      event: eventResult.event,
      recoveryCase: null,
      strategyDecision: null,
      validatedDecision: null,
      recoveryAction: null,
      outcome: null,
    };
  }

  /*
   * STEP 3
   * Stop if no recovery case is required.
   */
  if (!eventResult.recoveryCase) {
    return {
      status: "NO_RECOVERY_REQUIRED",
      event: eventResult.event,
      recoveryCase: null,
      strategyDecision: null,
      validatedDecision: null,
      recoveryAction: null,
      outcome: null,
    };
  }

  const recoveryCase =
    eventResult.recoveryCase;

  /*
   * STEP 4
   * Generate strategy decision.
   */
  const strategyDecision =
    await generateStrategyDecision(
      recoveryCase.id,
    );

  /*
   * STEP 5
   * Validate strategy against merchant policy.
   */
  const validatedDecision =
    await validateStrategyDecision(
      strategyDecision.id,
    );

  /*
   * STEP 6
   * Stop if policy rejected the decision.
   */
  if (
    validatedDecision.status !==
    "VALIDATED"
  ) {
    return {
      status: "POLICY_REJECTED",
      event: eventResult.event,
      recoveryCase,
      strategyDecision,
      validatedDecision,
      recoveryAction: null,
      outcome: null,
    };
  }

  /*
   * STEP 7
   * Create executable recovery action.
   */
  const recoveryAction =
    await createRecoveryAction(
      validatedDecision.id,
    );

  /*
   * STEP 8
   * Execute recovery action.
   *
   * Action Execution returns:
   * {
   *   action,
   *   outcome
   * }
   */
  const executionResult =
    await executeRecoveryAction(
      recoveryAction.id,
    );

  /*
   * STEP 9
   * Return complete pipeline result.
   */
  return {
    status:
      executionResult.action.status ===
      "SUCCEEDED"
        ? "RECOVERY_SUCCEEDED"
        : "RECOVERY_FAILED",

    event: eventResult.event,

    recoveryCase,

    strategyDecision,

    validatedDecision,

    recoveryAction:
      executionResult.action,

    outcome:
      executionResult.outcome,
  };
};