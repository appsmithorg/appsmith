import type { DefaultRootState } from "react-redux";
import type { WorkspaceDatasourceUsage } from "ee/api/WorkspaceApi";
import type { WorkspaceDatasourceUsageState } from "reducers/uiReducers/workspaceDatasourceUsageReducer";

const getWorkspaceDatasourceUsageState = (
  state: DefaultRootState,
): WorkspaceDatasourceUsageState => state.ui.workspaceDatasourceUsage;

export const selectWorkspaceDatasourceUsage = (
  state: DefaultRootState,
  workspaceId: string,
): WorkspaceDatasourceUsage[] =>
  getWorkspaceDatasourceUsageState(state).dataByWorkspaceId[workspaceId] ?? [];

export const selectWorkspaceDatasourceUsageLoading = (
  state: DefaultRootState,
  workspaceId: string,
): boolean =>
  getWorkspaceDatasourceUsageState(state).loadingByWorkspaceId[workspaceId] ??
  false;

export const selectWorkspaceDatasourceUsageForDatasource = (
  state: DefaultRootState,
  workspaceId: string,
  datasourceId: string,
): WorkspaceDatasourceUsage | undefined =>
  selectWorkspaceDatasourceUsage(state, workspaceId).find(
    (usage) => usage.datasourceId === datasourceId,
  );
