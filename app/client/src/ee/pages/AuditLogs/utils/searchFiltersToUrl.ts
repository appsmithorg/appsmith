import { AuditLogsFiltersReduxState } from "@appsmith/reducers/auditLogsReducer";

/**
 * searchFiltersToUrl takes audit logs searchFilters and creates search param string for an URL.
 * @param filters {AuditLogsFiltersReduxState}
 * @returns {string}
 */
export function searchFiltersToUrl(
  filters: AuditLogsFiltersReduxState,
): string {
  if (Object.keys(filters).length === 0) {
    return "";
  }
  const final = [];
  if (
    Array.isArray(filters.selectedEmails) &&
    filters.selectedEmails.length > 0
  ) {
    let searchStr = "emails=";
    searchStr += filters.selectedEmails.map((x) => x.value).join(",");
    final.push(searchStr);
  }
  if (
    Array.isArray(filters.selectedEvents) &&
    filters.selectedEvents.filter((e) => !!e).length > 0
  ) {
    let searchStr = "events=";
    searchStr += filters.selectedEvents.map((x) => x.value).join(",");
    final.push(searchStr);
  }
  if (filters.resourceId.length > 0) {
    let searchStr = "resourceId=";
    searchStr += filters.resourceId;
    final.push(searchStr);
  }
  if (filters.dateSortOrder.length > 0) {
    let searchStr = "sort=";
    searchStr += filters.dateSortOrder;
    final.push(searchStr);
  }
  if (Object.keys(filters.days).length > 0) {
    let searchStr = "days=";
    searchStr += filters.days.value;
    final.push(searchStr);
  }
  return "?" + final.join("&");
}
