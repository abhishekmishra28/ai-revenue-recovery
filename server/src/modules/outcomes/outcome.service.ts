import {
  findAllOutcomes,
  findOutcomeById,
  findOutcomesByRecoveryCaseId,
  findOutcomeByRecoveryActionId,
} from "./outcome.repository";

export const getOutcomes = () => {
  return findAllOutcomes();
};

export const getOutcome = (id: string) => {
  return findOutcomeById(id);
};

export const getOutcomesForRecoveryCase = (
  recoveryCaseId: string,
) => {
  return findOutcomesByRecoveryCaseId(recoveryCaseId);
};

export const getOutcomeForRecoveryAction = (
  recoveryActionId: string,
) => {
  return findOutcomeByRecoveryActionId(recoveryActionId);
};