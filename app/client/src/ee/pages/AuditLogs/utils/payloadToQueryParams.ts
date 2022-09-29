import { AuditLogsFiltersReduxState } from "@appsmith/reducers/auditLogsReducer";
import { DropdownOption } from "design-system";

export function payloadToQueryParams(
  payload: AuditLogsFiltersReduxState & { cursor: string },
) {
  const temp = {
    events: payload.selectedEvents.map((event: DropdownOption) => event.value),
    emails: payload.selectedEmails.map((event: DropdownOption) => event.value),
    resourceId: payload.resourceId,
    sortOrder: payload.dateSortOrder === "DESC" ? 0 : 1,
    numberOfDays: Number(payload.days.value),
    cursor: payload.cursor || "",
  };
  const out: any = {};
  if (temp.events.length > 0) {
    out.events = temp.events;
  }
  if (temp.emails.length > 0) {
    out.emails = temp.emails;
  }
  if (temp.resourceId.length > 0) {
    out.resourceId = temp.resourceId;
  }
  if (temp.sortOrder > 0) {
    out.sortOrder = temp.sortOrder;
  }
  if (temp.numberOfDays > 0) {
    out.numberOfDays = temp.numberOfDays;
  }
  if (temp.cursor.length > 0) {
    out.cursor = temp.cursor;
  }
  return out;
}
