import { all, put, call, takeLatest } from "redux-saga/effects";

import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { InitWorkflowEditorPayload } from "@appsmith/actions/workflowActions";
import WorkflowEditorEngine from "@appsmith/entities/Engine/WorkflowEditorEngine";

export function* startWorkflowEngine(
  action: ReduxAction<InitWorkflowEditorPayload>,
) {
  try {
    const workflowEngine = new WorkflowEditorEngine();
    const { workflowId } = action.payload;
    yield call(workflowEngine.setupEngine);
    yield call(workflowEngine.loadWorkflow, workflowId);
    // TODO (Workflows): Lot of these apis require separate workflow apis without dependance on pageId or applicationId
    yield call(workflowEngine.loadPageThemesAndActions, workflowId);
    yield call(workflowEngine.loadPluginsAndDatasources);
    yield call(workflowEngine.completeChore);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.INITIALIZE_WORKFLOW_EDITOR_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* watchWorkflowInitSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.INITIALIZE_WORKFLOW_EDITOR,
      startWorkflowEngine,
    ),
  ]);
}
