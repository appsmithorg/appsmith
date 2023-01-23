import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import { DropdownOption } from "design-system-old";
import { AuditLogType } from "@appsmith/pages/AuditLogs/types";
import union from "lodash/union";
import { unionWith, uniqWith } from "lodash";
import { AUDIT_LOGS_PAGE_SIZE } from "@appsmith/pages/AuditLogs/config/audit-logs-config";
import {
  toEvent,
  toUserEmail,
} from "../pages/AuditLogs/utils/toDropdownOption";

export interface AuditLogsReduxStateBase {
  dirty: boolean;
}

export const initialBaseState: AuditLogsReduxStateBase = {
  dirty: false,
};

export enum DATE_SORT_ORDER {
  DESC = "DESC",
  ASC = "ASC",
}

export interface AuditLogsDateSortOrder {
  dateSortOrder: DATE_SORT_ORDER;
}

const initialAuditLogsDateSortOrder: AuditLogsDateSortOrder = {
  dateSortOrder: DATE_SORT_ORDER.DESC,
};

export interface AuditLogsDateFilter {
  startDate: number;
  endDate: number;
}

export const initialAuditLogsDateFilter: AuditLogsDateFilter = {
  startDate: 0,
  endDate: 0,
};

export interface AuditLogsFiltersReduxState
  extends AuditLogsDateSortOrder,
    AuditLogsDateFilter {
  /**
   * selectedEmails are the values that users dropdown filter uses.
   */
  selectedEmails: DropdownOption[];
  /**
   * selectedEvents are the event values that events dropdown filter uses.
   */
  selectedEvents: DropdownOption[];
  /**
   * resourceId {string} is the id from the resource object in {AuditLogType[]}
   */
  resourceId: string;
}

export const initialAuditLogsFilterState: AuditLogsFiltersReduxState = {
  ...initialAuditLogsDateFilter,
  ...initialAuditLogsDateSortOrder,
  selectedEmails: [],
  selectedEvents: [],
  resourceId: "",
};

export interface AuditLogsEmailsReduxStore {
  /**
   * emails {DropdownOption[]} is the emails data from /filers api and modified to DropdownOption
   */
  emails: DropdownOption[];
}

const initialEmailsState: AuditLogsEmailsReduxStore = {
  emails: [] as DropdownOption[],
};

export interface AuditLogsEventsReduxStore {
  /**
   * events {DropdownOption[]} is the events data from /filers api and modified to DropdownOption
   */
  events: DropdownOption[];
}

const initialEventsState: AuditLogsEventsReduxStore = {
  events: [] as DropdownOption[],
};

export interface AuditLogsReduxState
  extends AuditLogsReduxStateBase,
    AuditLogsEmailsReduxStore,
    AuditLogsEventsReduxStore {
  /**
   * filters {AuditLogsFiltersReduxState} contains the filters for the audit logs feature
   */
  searchFilters: AuditLogsFiltersReduxState;
  /**
   * @param {boolean} isLoading Keeps track of the audit logs network call.
   * It is true when the logs are being fetched from the server.
   */
  isLoading: boolean;
  /**
   * @param {AuditLogType[]} logs contains the data that is fetched from /logs api
   * And this is the data that has gone through dbToLogs()
   * But it still contain some data that we don't want to show to user.
   */
  logs: AuditLogType[];
  /**
   * @param {boolean} hasMore Keeps track of the number of audit logs in backend.
   * It is true when the server returns {AUDIT_LOGS_PAGE_SIZE} logs.
   * If number of logs is less than that or 0, then it is false.
   */
  hasMore: boolean;
}

export const initialAuditLogsState: AuditLogsReduxState = {
  ...initialBaseState,
  ...initialEmailsState,
  ...initialEventsState,
  searchFilters: { ...initialAuditLogsFilterState },
  isLoading: true,
  logs: [],
  hasMore: true,
  dirty: false,
};

const handlers = {
  [ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_INIT]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: true,
    hasMore: true,
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_SUCCESS]: (
    state: AuditLogsReduxState,
    action: ReduxAction<AuditLogType[]>,
  ) => ({
    ...state,
    isLoading: false,
    logs: action.payload.map((log: AuditLogType) => {
      log.isOpen = false;
      return log;
    }),
    hasMore: !(
      action.payload.length === 0 ||
      action.payload.length < AUDIT_LOGS_PAGE_SIZE
    ),
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_FAILED]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_INIT]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_SUCCESS]: (
    state: AuditLogsReduxState,
    action: ReduxAction<any>,
  ) => ({
    ...state,
    isLoading: false,
    logs: unionWith(
      state.logs,
      action.payload.map((log: AuditLogType) => {
        log.isOpen = false;
        return log;
      }),
      (a, b) => a.id === b.id,
    ),
    hasMore: !(
      action.payload.length === 0 ||
      action.payload.length < AUDIT_LOGS_PAGE_SIZE
    ),
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_FAILED]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_EMAILS_INIT]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: true,
    dirty: true,
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_EMAILS_SUCCESS]: (
    state: AuditLogsReduxState,
    action: ReduxAction<any>,
  ) => ({
    ...state,
    isLoading: false,
    emails: union<string>(
      state.emails.map((e) => e.value as string),
      action.payload,
    ).map(toUserEmail),
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_EMAILS_FAILED]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_EVENTS_INIT]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: true,
    dirty: true,
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_EVENTS_SUCCESS]: (
    state: AuditLogsReduxState,
    action: ReduxAction<any>,
  ) => ({
    ...state,
    isLoading: false,
    events: union<string>(
      state.events.map((e) => e.value as string),
      action.payload,
    ).map(toEvent),
  }),
  [ReduxActionTypes.FETCH_AUDIT_LOGS_EMAILS_FAILED]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.SET_ONLY_RESOURCE_ID_JSON_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ resourceId: string }>,
  ) => ({
    ...state,
    searchFilters: {
      ...state.searchFilters,
      resourceId: action.payload.resourceId,
    },
    dirty: true,
  }),
  [ReduxActionTypes.SET_RESOURCE_ID_JSON_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ resourceId: string }>,
  ) => ({
    ...state,
    resourceId: action.payload.resourceId,
    searchFilters: {
      ...state.searchFilters,
      resourceId: action.payload.resourceId,
    },
    dirty: true,
  }),
  [ReduxActionTypes.SET_ONLY_EMAIL_JSON_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ email: DropdownOption }>,
  ) => ({
    ...state,
    searchFilters: {
      ...state.searchFilters,
      selectedEmails: [action.payload.email],
    },
    dirty: true,
  }),
  [ReduxActionTypes.ADD_EMAIL_JSON_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ email: DropdownOption }>,
  ) => ({
    ...state,
    selectedEmails: uniqWith(
      [...state.searchFilters.selectedEmails, action.payload.email],
      (a, b) => a.id === b.id,
    ),
    searchFilters: {
      ...state.searchFilters,
      selectedEmails: uniqWith(
        [...state.searchFilters.selectedEmails, action.payload.email],
        (a, b) => a.id === b.id,
      ),
    },
    dirty: true,
  }),
  [ReduxActionTypes.SET_ONLY_EVENT_JSON_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ event: DropdownOption }>,
  ) => ({
    ...state,
    searchFilters: {
      ...state.searchFilters,
      selectedEvents: [action.payload.event],
    },
    dirty: true,
  }),
  [ReduxActionTypes.ADD_EVENT_JSON_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ event: DropdownOption }>,
  ) => ({
    ...state,
    selectedEvents: uniqWith(
      [...state.searchFilters.selectedEvents, action.payload.event],
      (a, b) => a.id === b.id,
    ),
    searchFilters: {
      ...state.searchFilters,
      selectedEvents: uniqWith(
        [...state.searchFilters.selectedEvents, action.payload.event],
        (a, b) => a.id === b.id,
      ),
    },
    dirty: true,
  }),
  [ReduxActionTypes.SET_AUDIT_LOGS_ON_URL_LOAD_FILTERS]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{
      emails: DropdownOption[];
      events: DropdownOption[];
      startDate: number;
      endDate: number;
      resourceId: string;
      sort: DATE_SORT_ORDER;
      dirty: boolean;
    }>,
  ) => ({
    ...state,
    dirty: action.payload.dirty,
    searchFilters: {
      dateSortOrder: action.payload.sort,
      startDate: action.payload.startDate,
      endDate: action.payload.endDate,
      resourceId: action.payload.resourceId,
      selectedEmails: action.payload.emails,
      selectedEvents: action.payload.events,
    },
  }),
  /**
   * This state reducing function resets every filter to empty values.
   * @param state {AuditLogsReduxState}
   * @returns {AuditLogsReduxState}
   */
  [ReduxActionTypes.RESET_AUDIT_LOGS_FILTERS]: (
    state: AuditLogsReduxState,
  ): AuditLogsReduxState => ({
    ...state,
    dirty: false,
    isLoading: false,
    searchFilters: {
      startDate: initialAuditLogsDateFilter.startDate,
      endDate: initialAuditLogsDateFilter.endDate,
      dateSortOrder: DATE_SORT_ORDER.DESC,
      selectedEmails: [],
      selectedEvents: [],
      resourceId: "",
    },
  }),
  [ReduxActionTypes.SET_AUDIT_LOGS_DATE_SORT_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<AuditLogsDateSortOrder>,
  ) => ({
    ...state,
    dirty: true,
    isLoading: true,
    searchFilters: {
      ...state.searchFilters,
      dateSortOrder: action?.payload?.dateSortOrder,
    },
  }),
  [ReduxActionTypes.REFRESH_AUDIT_LOGS_INIT]: (state: AuditLogsReduxState) => ({
    ...state,
    isLoading: true,
    hasMore: true,
  }),
  [ReduxActionTypes.REFRESH_AUDIT_LOGS_SUCCESS]: (
    state: AuditLogsReduxState,
  ) => ({
    ...state,
    isLoading: false,
    hasMore: true,
  }),
  [ReduxActionTypes.REPLACE_AUDIT_LOGS_SELECTED_EMAILS]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ emails: DropdownOption[] }>,
  ) => ({
    ...state,
    searchFilters: {
      ...state.searchFilters,
      selectedEmails:
        action.payload.emails || initialAuditLogsFilterState.selectedEmails,
    },
    dirty: true,
  }),
  [ReduxActionTypes.REPLACE_AUDIT_LOGS_SELECTED_EVENTS]: (
    state: AuditLogsReduxState,
    action: ReduxAction<{ events: DropdownOption[] }>,
  ) => ({
    ...state,
    searchFilters: {
      ...state.searchFilters,
      selectedEvents:
        action.payload.events || initialAuditLogsFilterState.selectedEvents,
    },
    dirty: true,
  }),
  [ReduxActionTypes.SET_AUDIT_LOGS_DATE_FILTER]: (
    state: AuditLogsReduxState,
    action: ReduxAction<AuditLogsDateFilter>,
  ) => ({
    ...state,
    searchFilters: {
      ...state.searchFilters,
      ...action.payload,
    },
    dirty: true,
  }),
  [ReduxActionTypes.MARK_AUDIT_LOGS_LOG_OPEN]: (
    state: AuditLogsReduxState,
    action: ReduxAction<AuditLogType>,
  ) => ({
    ...state,
    logs: state.logs.map((log: AuditLogType) => {
      if (log.id === action.payload.id) {
        log.isOpen = true;
      }
      return log;
    }),
  }),
  [ReduxActionTypes.MARK_AUDIT_LOGS_LOG_CLOSE]: (
    state: AuditLogsReduxState,
    action: ReduxAction<AuditLogType>,
  ) => ({
    ...state,
    logs: state.logs.map((log: AuditLogType) => {
      if (log.id === action.payload.id) {
        log.isOpen = false;
      }
      return log;
    }),
  }),
  [ReduxActionTypes.RESET_AUDIT_LOGS]: () => ({ ...initialAuditLogsState }),
};

export default createReducer(initialAuditLogsState, handlers);
