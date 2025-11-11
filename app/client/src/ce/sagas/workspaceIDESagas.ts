import { put, call } from "redux-saga/effects";
import WorkspaceApi from "ee/api/WorkspaceApi";
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";

import { ReduxActionErrorTypes } from "ee/constants/ReduxActionConstants";
import WorkspaceEditorEngine from "entities/Engine/WorkspaceEditorEngine";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type {
  FetchWorkspaceDatasourceUsagePayload,
  InitWorkspaceIDEPayload,
} from "ee/actions/workspaceIDEActions";
import {
  fetchWorkspaceDatasourceUsageError,
  fetchWorkspaceDatasourceUsageSuccess,
} from "ee/actions/workspaceIDEActions";
import type { FetchWorkspaceDatasourceUsageResponse } from "ee/api/WorkspaceApi";
import { resetEditorRequest } from "actions/initActions";

export function* startWorkspaceIDE(
  action: ReduxAction<InitWorkspaceIDEPayload>,
) {
  try {
    const workspaceEngine = new WorkspaceEditorEngine();
    const { workspaceId } = action.payload;

    /**
     * During editor switches like app (view mode) -> workspace
     * there are certain cases were stale data stays in reducers.
     * This ensures a clean state of reducers and avoids any dependency
     */
    yield put(resetEditorRequest());
    yield call(workspaceEngine.setupEngine);
    yield call(workspaceEngine.loadWorkspace, workspaceId);
    yield call(workspaceEngine.loadPluginsAndDatasources, workspaceId);
    yield call(workspaceEngine.completeChore);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.INITIALIZE_WORKSPACE_IDE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchWorkspaceDatasourceUsageSaga(
  action: ReduxAction<FetchWorkspaceDatasourceUsagePayload>,
) {
  const { workspaceId } = action.payload;

  try {
    const response: FetchWorkspaceDatasourceUsageResponse = yield call(
      WorkspaceApi.fetchWorkspaceDatasourceUsage,
      action.payload,
    );
    const isValid: boolean = yield call(validateResponse, response);

    if (isValid) {
      const data = response.data ?? [];

      yield put(
        fetchWorkspaceDatasourceUsageSuccess({
          workspaceId,
          data,
        }),
      );
    }
  } catch (error) {
    log.error("Failed to load workspace datasource usage", error);
    yield put(
      fetchWorkspaceDatasourceUsageError({
        workspaceId,
        error,
      }),
    );
  }
}
