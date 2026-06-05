export type OnlyOfficeCallbackPayload = {
  status: number;
  url?: string;
};

export function isOnlyOfficeSaveEvent(payload: OnlyOfficeCallbackPayload) {
  return payload.status === 2 || payload.status === 6;
}
