import {
  findAllRevenueEvents,
  findRevenueEventById,
  findRevenueEventsByMerchantId,
  findRevenueEventsByCustomerId,
} from "./revenue-event.repository";

export const getAllRevenueEvents = () => {
  return findAllRevenueEvents();
};

export const getRevenueEventById = (id: string) => {
  return findRevenueEventById(id);
};

export const getRevenueEventsByMerchantId = (merchantId: string) => {
  return findRevenueEventsByMerchantId(merchantId);
};

export const getRevenueEventsByCustomerId = (customerId: string) => {
  return findRevenueEventsByCustomerId(customerId);
};