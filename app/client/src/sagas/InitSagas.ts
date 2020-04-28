import { all, put, takeLatest, take, select } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  InitializeEditorPayload,
} from "constants/ReduxActionConstants";

import { fetchEditorConfigs } from "actions/configsActions";
import { fetchPage, fetchPageList } from "actions/pageActions";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPlugins } from "actions/pluginActions";
import { fetchActions } from "actions/actionActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "selectors/applicationSelectors";

function* initializeEditorSaga(
  initializeEditorAction: ReduxAction<InitializeEditorPayload>,
) {
  const { applicationId, pageId } = initializeEditorAction.payload;
  // Step 1: Start getting all the data needed by the
  yield all([
    put(fetchPlugins()),
    put(fetchPageList(applicationId)),
    put(fetchEditorConfigs()),
    put(fetchActions(applicationId)),
    put(fetchDatasources()),
    put(fetchPage(pageId)),
  ]);
  // Step 2: Wait for all data to be in the state
  yield all([
    take(ReduxActionTypes.FETCH_PLUGINS_SUCCESS),
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.FETCH_PAGE_SUCCESS),
    take(ReduxActionTypes.UPDATE_CURRENT_PAGE),
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
    take(ReduxActionTypes.FETCH_DATASOURCES_SUCCESS),
  ]);

  const currentApplication = yield select(getCurrentApplication);

  const appName = currentApplication ? currentApplication.name : "";
  const appId = currentApplication ? currentApplication.id : "";

  AnalyticsUtil.logEvent("EDITOR_OPEN", {
    appId: appId,
    appName: appName,
  });

  // Step 6: Notify UI that the editor is ready to go
  yield put({
    type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
  });
}

export function* initializeAppViewerSaga(
  action: ReduxAction<{ pageId: string; applicationId: string }>,
) {
  const { applicationId } = action.payload;
  yield all([
    put(fetchActions(applicationId)),
    put(fetchPageList(applicationId)),
  ]);

  yield all([
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
  ]);

  yield put({
    type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
  });
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
