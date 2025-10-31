import { all, put, call, takeLatest } from "redux-saga/effects";

import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import WorkspaceEditorEngine from "ee/entities/Engine/WorkspaceEditorEngine";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { InitWorkspaceIDEPayload } from "ee/actions/workspaceIDEActions";
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

export default function* watchWorkspaceIDESagas() {
  yield all([
    takeLatest(ReduxActionTypes.INITIALIZE_WORKSPACE_IDE, startWorkspaceIDE),
  ]);
}
