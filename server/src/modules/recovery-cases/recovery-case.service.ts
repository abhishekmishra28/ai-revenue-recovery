import {
  findAllRecoveryCases,
  findRecoveryCaseById,
} from "./recovery-case.repository";

export const getRecoveryCases = () => {
  return findAllRecoveryCases();
};

export const getRecoveryCase = (id: string) => {
  return findRecoveryCaseById(id);
};