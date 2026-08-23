import { findAllMerchants } from "./merchant.repository";

export const getAllMerchants = async () => {
  return findAllMerchants();
};