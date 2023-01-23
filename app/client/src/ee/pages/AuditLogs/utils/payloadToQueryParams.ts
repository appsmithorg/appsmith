import { AuditLogsFiltersReduxState } from "@appsmith/reducers/auditLogsReducer";
import { DropdownOption } from "design-system-old";

export function payloadToQueryParams(
  payload: AuditLogsFiltersReduxState & { cursor: string },
) {
  const temp = {
    events: payload.selectedEvents.map((event: DropdownOption) => event.value),
    emails: payload.selectedEmails.map((event: DropdownOption) => event.value),
    resourceId: payload.resourceId,
    sortOrder: payload.dateSortOrder === "DESC" ? 0 : 1,
    startDate: payload.startDate,
    endDate: payload.endDate,
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
  if (temp.startDate > 0) {
    out.startDate = temp.startDate;
  }
  if (temp.endDate > 0) {
    out.endDate = temp.endDate;
  }
  if (temp.cursor.length > 0) {
    out.cursor = temp.cursor;
  }
  return out;
}
