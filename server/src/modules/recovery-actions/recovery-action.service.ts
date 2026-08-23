import {
  findAllRecoveryActions,
  findRecoveryActionById,
  findRecoveryActionsByRecoveryCaseId,
} from "./recovery-action.repository";

export const getRecoveryActions = () => {
  return findAllRecoveryActions();
};

export const getRecoveryAction = (id: string) => {
  return findRecoveryActionById(id);
};

export const getRecoveryActionsForRecoveryCase = (
  recoveryCaseId: string
) => {
  return findRecoveryActionsByRecoveryCaseId(recoveryCaseId);
};