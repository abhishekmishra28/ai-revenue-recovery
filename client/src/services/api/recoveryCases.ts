import { apiClient } from "./client";
import { RecoveryCase } from "@/types/api";

export const getRecoveryCases = () => {
  return apiClient.get<RecoveryCase[]>(
    "/recovery-cases",
  );
};

export const getRecoveryCase = (id: string) => {
  return apiClient.get<RecoveryCase>(
    `/recovery-cases/${id}`,
  );
};