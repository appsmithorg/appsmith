import { all, put, takeLatest, take } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  InitializeEditorPayload,
} from "constants/ReduxActionConstants";

import { fetchEditorConfigs } from "actions/configsActions";
import { fetchPageList } from "actions/pageActions";
import { fetchActions } from "actions/actionActions";
import { fetchDatasources } from "actions/datasourcesActions";
import { initBindingMapListener } from "actions/bindingActions";
import { fetchPlugins } from "actions/pluginActions";

function* initializeEditorSaga(
  initializeEditorAction: ReduxAction<InitializeEditorPayload>,
) {
  const { applicationId } = initializeEditorAction.payload;
  // Step 1: Start getting all the data needed by the
  yield all([
    put(fetchPlugins()),
    put(fetchPageList(applicationId)),
    put(fetchEditorConfigs()),
    put(initBindingMapListener()),
    put(fetchActions()),
    put(fetchDatasources()),
  ]);
  // Step 2: Wait for all data to be in the state
  yield all([
    take(ReduxActionTypes.FETCH_PLUGINS_SUCCESS),
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
    take(ReduxActionTypes.FETCH_DATASOURCES_SUCCESS),
  ]);

  // Step 6: Notify UI that the editor is ready to go
  yield put({
    type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
  });
}

export function* initializeAppViewerSaga(
  action: ReduxAction<{ pageId: string; applicationId: string }>,
) {
  const { applicationId } = action.payload;
  yield put(initBindingMapListener());
  yield all([put(fetchPageList(applicationId)), put(fetchActions())]);

  yield all([
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
  ]);
}

export default function* watchInitSagas() {
  yield all([
    takeLatest(ReduxActionTypes.INITIALIZE_EDITOR, initializeEditorSaga),
    takeLatest(
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      initializeAppViewerSaga,
    ),
  ]);
}
