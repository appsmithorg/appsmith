import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { WorkspaceDatasourceUsage } from "ee/api/WorkspaceApi";

export interface WorkspaceDatasourceUsageState {
  dataByWorkspaceId: Record<string, WorkspaceDatasourceUsage[]>;
  loadingByWorkspaceId: Record<string, boolean>;
  errorByWorkspaceId: Record<string, unknown>;
}

const initialState: WorkspaceDatasourceUsageState = {
  dataByWorkspaceId: {},
  loadingByWorkspaceId: {},
  errorByWorkspaceId: {},
};

const workspaceDatasourceUsageReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_WORKSPACE_DATASOURCE_USAGE_INIT]: (
    draft,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    const { workspaceId } = action.payload;

    draft.loadingByWorkspaceId[workspaceId] = true;
    draft.errorByWorkspaceId[workspaceId] = undefined;
  },
  [ReduxActionTypes.FETCH_WORKSPACE_DATASOURCE_USAGE_SUCCESS]: (
    draft,
    action: ReduxAction<{
      workspaceId: string;
      data: WorkspaceDatasourceUsage[];
    }>,
  ) => {
    const { data, workspaceId } = action.payload;

    draft.loadingByWorkspaceId[workspaceId] = false;
    draft.dataByWorkspaceId[workspaceId] = data;
    draft.errorByWorkspaceId[workspaceId] = undefined;
  },
  [ReduxActionErrorTypes.FETCH_WORKSPACE_DATASOURCE_USAGE_ERROR]: (
    draft,
    action: ReduxAction<{ workspaceId: string; error?: unknown }>,
  ) => {
    const { error, workspaceId } = action.payload;

    draft.loadingByWorkspaceId[workspaceId] = false;
    draft.errorByWorkspaceId[workspaceId] = error;
  },
});

export default workspaceDatasourceUsageReducer;
