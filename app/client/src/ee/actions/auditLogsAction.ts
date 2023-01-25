import { AuditLogType } from "@appsmith/pages/AuditLogs/types";
import {
  DATE_SORT_ORDER,
  AuditLogsFiltersReduxState,
  AuditLogsDateFilter,
} from "@appsmith/reducers/auditLogsReducer";
import { DropdownOption } from "design-system-old";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const setUserCanAccessAuditLogs = () => ({
  type: ReduxActionTypes.SET_USER_CAN_ACCESS_AUDIT_LOGS,
});

export const setUserCannotAccessAuditLogs = () => ({
  type: ReduxActionTypes.SET_USER_CANNOT_ACCESS_AUDIT_LOGS,
});

/**
 * refreshAuditLogsInit This function is fired when Refresh button is clicked on audit logs page.
 * This fetches filters and logs.
 * @param payload {AuditLogsFiltersReduxState}
 */
export const refreshAuditLogsInit = (payload: AuditLogsFiltersReduxState) => ({
  type: ReduxActionTypes.REFRESH_AUDIT_LOGS_INIT,
  payload,
});

export const setResourceIdJsonFilter = (payload: { resourceId: string }) => ({
  type: ReduxActionTypes.SET_RESOURCE_ID_JSON_FILTER,
  payload,
});

export const setOnlyEmailJsonFilter = (payload: { email: DropdownOption }) => ({
  type: ReduxActionTypes.SET_ONLY_EMAIL_JSON_FILTER,
  payload,
});

export const setEmailJsonFilter = (payload: { email: DropdownOption }) => ({
  type: ReduxActionTypes.ADD_EMAIL_JSON_FILTER,
  payload,
});

export const setEventJsonFilter = (payload: { event: DropdownOption }) => ({
  type: ReduxActionTypes.ADD_EVENT_JSON_FILTER,
  payload,
});

export const setOnlyEventJsonFilter = (payload: { event: DropdownOption }) => ({
  type: ReduxActionTypes.SET_ONLY_EVENT_JSON_FILTER,
  payload,
});

export const setOnlyResourceIdJsonFilter = (payload: {
  resourceId: string;
}) => ({
  type: ReduxActionTypes.SET_ONLY_RESOURCE_ID_JSON_FILTER,
  payload,
});

export const fetchAuditLogsLogsSuccess = (payload: any[]) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_SUCCESS,
  payload,
});

export const fetchAuditLogsEmailsSuccess = (payload: any[]) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_EMAILS_SUCCESS,
  payload,
});

export const fetchAuditLogsEventsSuccess = (payload: any[]) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_EVENTS_SUCCESS,
  payload,
});

export const setAuditLogsOnUrlLoadFilters = (
  {
    emails,
    endDate,
    events,
    resourceId,
    sort,
    startDate,
  }: {
    emails: DropdownOption[];
    events: DropdownOption[];
    startDate: number;
    endDate: number;
    resourceId: string;
    sort: DATE_SORT_ORDER;
  },
  dirty: boolean,
) => ({
  type: ReduxActionTypes.SET_AUDIT_LOGS_ON_URL_LOAD_FILTERS,
  payload: {
    emails,
    events,
    startDate,
    endDate,
    resourceId,
    sort,
    dirty,
  },
});

export const resetAuditLogsFilters = () => ({
  type: ReduxActionTypes.RESET_AUDIT_LOGS_FILTERS,
});

export const setAuditLogsDateSortOrder = ({
  sort,
}: {
  sort: DATE_SORT_ORDER;
}) => ({
  type: ReduxActionTypes.SET_AUDIT_LOGS_DATE_SORT_FILTER,
  payload: { dateSortOrder: sort },
});

export const fetchAuditLogsMetadataInit = () => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_METADATA_INIT,
});

export const fetchAuditLogsLogsInit = (
  filters: AuditLogsFiltersReduxState,
) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_INIT,
  payload: filters,
});

export const replaceAuditLogsEmails = (payload: {
  emails: DropdownOption[];
}) => ({
  type: ReduxActionTypes.REPLACE_AUDIT_LOGS_SELECTED_EMAILS,
  payload: { emails: payload.emails },
});

export const replaceAuditLogsEvents = (payload: {
  events: DropdownOption[];
}) => ({
  type: ReduxActionTypes.REPLACE_AUDIT_LOGS_SELECTED_EVENTS,
  payload: { events: payload.events },
});

export const setAuditLogsDateFilter = (payload: AuditLogsDateFilter) => ({
  type: ReduxActionTypes.SET_AUDIT_LOGS_DATE_FILTER,
  payload,
});

export const fetchAuditLogsLogsNextPage = (
  payload: AuditLogsFiltersReduxState & { cursor: string },
) => ({
  type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_INIT,
  payload,
});

export const markAuditLogOpen = (payload: AuditLogType) => ({
  type: ReduxActionTypes.MARK_AUDIT_LOGS_LOG_OPEN,
  payload,
});

export const markAuditLogClose = (payload: AuditLogType) => ({
  type: ReduxActionTypes.MARK_AUDIT_LOGS_LOG_CLOSE,
  payload,
});

export const resetAuditLogs = () => ({
  type: ReduxActionTypes.RESET_AUDIT_LOGS,
});
