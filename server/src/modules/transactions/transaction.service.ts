import {
  findAllTransactions,
  findTransactionById,
  findTransactionsByCustomerId,
  findTransactionsByMerchantId,
} from "./transaction.repository";

export const getAllTransactions = () => {
  return findAllTransactions();
};

export const getTransactionById = (id: string) => {
  return findTransactionById(id);
};

export const getTransactionsByCustomerId = (customerId: string) => {
  return findTransactionsByCustomerId(customerId);
};

export const getTransactionsByMerchantId = (merchantId: string) => {
  return findTransactionsByMerchantId(merchantId);
};