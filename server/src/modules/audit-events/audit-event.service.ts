import {
  findAllAuditEvents,
  findAuditEventById,
  findAuditEventsByMerchantId,
  findAuditEventsByRecoveryCaseId,
} from "./audit-event.repository";

export const getAuditEvents = () => {
  return findAllAuditEvents();
};

export const getAuditEvent = (id: string) => {
  return findAuditEventById(id);
};

export const getAuditEventsForMerchant = (merchantId: string) => {
  return findAuditEventsByMerchantId(merchantId);
};

export const getAuditEventsForRecoveryCase = (
  recoveryCaseId: string,
) => {
  return findAuditEventsByRecoveryCaseId(recoveryCaseId);
};