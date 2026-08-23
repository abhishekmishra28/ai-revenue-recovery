import {
  findAllCustomers,
  findCustomerById,
  findCustomersByMerchantId,
} from "./customer.repository";

export const getAllCustomers = () => {
  return findAllCustomers();
};

export const getCustomerById = (id: string) => {
  return findCustomerById(id);
};

export const getCustomersByMerchantId = (merchantId: string) => {
  return findCustomersByMerchantId(merchantId);
};