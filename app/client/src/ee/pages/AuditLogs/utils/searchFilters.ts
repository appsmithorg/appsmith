import {
  AuditLogsFiltersReduxState,
  DATE_SORT_ORDER,
} from "@appsmith/reducers/auditLogsReducer";

export function areSearchFiltersDefault(
  searchFilters: AuditLogsFiltersReduxState,
) {
  const noEmails = searchFilters.selectedEmails.length === 0;
  const noEvents = searchFilters.selectedEvents.length === 0;
  const noResourceId = searchFilters.resourceId.length === 0;
  const defaultDate = searchFilters.days.value === "0";
  const defaultSort = searchFilters.dateSortOrder === DATE_SORT_ORDER.DESC;
  const allDefault =
    noEmails && noEvents && noResourceId && defaultDate && defaultSort;
  return !allDefault;
}
