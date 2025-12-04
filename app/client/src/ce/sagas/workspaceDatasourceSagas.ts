import { put, call } from "redux-saga/effects";

import { ReduxActionErrorTypes } from "ee/constants/ReduxActionConstants";
import WorkspaceDatasourceEngine from "entities/Engine/WorkspaceDatasourceEngine";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { InitWorkspaceDatasourcePayload } from "ee/actions/workspaceDatasourceActions";
import { resetEditorRequest } from "actions/initActions";

export function* startWorkspaceDatasource(
  action: ReduxAction<InitWorkspaceDatasourcePayload>,
) {
  try {
    const workspaceDatasourceEngine = new WorkspaceDatasourceEngine();
    const { workspaceId } = action.payload;

    /**
     * During editor switches like app (view mode) -> workspace
     * there are certain cases were stale data stays in reducers.
     * This ensures a clean state of reducers and avoids any dependency
     */
    yield put(resetEditorRequest());
    yield call(workspaceDatasourceEngine.setupEngine);
    yield call(workspaceDatasourceEngine.loadWorkspace, workspaceId);
    yield call(
      workspaceDatasourceEngine.loadPluginsAndDatasources,
      workspaceId,
    );
    yield call(workspaceDatasourceEngine.completeChore);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.INITIALIZE_WORKSPACE_DATASOURCE_ERROR,
      payload: {
        error,
      },
    });
  }
}
