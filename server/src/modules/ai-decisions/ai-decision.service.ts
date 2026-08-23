import {
  findAllAIDecisions,
  findAIDecisionById,
  findAIDecisionsByRecoveryCaseId,
} from "./ai-decision.repository";

export const getAIDecisions = () => {
  return findAllAIDecisions();
};

export const getAIDecision = async (id: string) => {
  return findAIDecisionById(id);
};

export const getAIDecisionsForRecoveryCase = (
  recoveryCaseId: string
) => {
  return findAIDecisionsByRecoveryCaseId(recoveryCaseId);
};