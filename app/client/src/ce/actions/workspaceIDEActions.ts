import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { WorkspaceDatasourceUsage } from "ee/api/WorkspaceApi";

export interface InitWorkspaceIDEPayload {
  workspaceId: string;
}

export const initWorkspaceIDE = (payload: InitWorkspaceIDEPayload) => ({
  type: ReduxActionTypes.INITIALIZE_WORKSPACE_IDE,
  payload,
});

export interface FetchWorkspaceDatasourceUsagePayload {
  workspaceId: string;
}

export interface FetchWorkspaceDatasourceUsageSuccessPayload {
  workspaceId: string;
  data: WorkspaceDatasourceUsage[];
}

export interface FetchWorkspaceDatasourceUsageErrorPayload {
  workspaceId: string;
  error?: unknown;
}

export const fetchWorkspaceDatasourceUsage = (
  payload: FetchWorkspaceDatasourceUsagePayload,
) => ({
  type: ReduxActionTypes.FETCH_WORKSPACE_DATASOURCE_USAGE_INIT,
  payload,
});

export const fetchWorkspaceDatasourceUsageSuccess = (
  payload: FetchWorkspaceDatasourceUsageSuccessPayload,
) => ({
  type: ReduxActionTypes.FETCH_WORKSPACE_DATASOURCE_USAGE_SUCCESS,
  payload,
});

export const fetchWorkspaceDatasourceUsageError = (
  payload: FetchWorkspaceDatasourceUsageErrorPayload,
) => ({
  type: ReduxActionErrorTypes.FETCH_WORKSPACE_DATASOURCE_USAGE_ERROR,
  payload,
});
