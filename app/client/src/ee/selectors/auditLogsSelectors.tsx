import type { AppState } from "@appsmith/reducers";
import type {
  AuditLogsReduxState,
  AuditLogsFiltersReduxState,
} from "@appsmith/reducers/auditLogsReducer";
import type { AuditLogType } from "@appsmith/pages/AuditLogs/types";

export const selectAuditLogsData = (state: AppState): AuditLogsReduxState =>
  state?.auditLogs;

export const selectAuditLogsLogs = (state: AppState): AuditLogType[] =>
  state?.auditLogs?.logs;

export const selectAuditLogsSearchFilters = (
  state: AppState,
): AuditLogsFiltersReduxState => state?.auditLogs?.searchFilters;

export const selectAuditLogsFiltersDirtyBit = (state: AppState): boolean => {
  const data = state?.auditLogs;
  const { dirty } = data;
  return dirty;
};

export const selectAuditLogsLogById = (state: AppState, id: string) =>
  state?.auditLogs?.logs?.find((log: AuditLogType) => log.id === id);

export const selectAuditLogsIsLoading = (state: AppState) =>
  state?.auditLogs?.isLoading;
