import { all, select, put, takeLatest, take } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import {
  getPropertyPaneConfigsId,
  getCurrentPageId,
} from "../selectors/editorSelectors";
import { fetchEditorConfigs } from "../actions/configsActions";
import { fetchPage, fetchPageList } from "../actions/pageActions";
import { fetchActions } from "../actions/actionActions";
import { fetchDatasources } from "../actions/datasourcesActions";
import { initBindingMapListener } from "../actions/bindingActions";

function* initializeEditorSaga() {
  // Step 1: Start getting all the data needed by the app
  const propertyPaneConfigsId = yield select(getPropertyPaneConfigsId);
  const currentPageId = yield select(getCurrentPageId);
  yield all([
    put(initBindingMapListener()),
    put(fetchPageList()),
    put(fetchEditorConfigs({ propertyPaneConfigsId })),
    put(fetchPage(currentPageId)),
    put(fetchActions()),
    put(fetchDatasources()),
  ]);
  // Step 2: Wait for all data to be in the state
  yield all([
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.UPDATE_CANVAS),
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
    take(ReduxActionTypes.FETCH_DATASOURCES_SUCCESS),
  ]);
  // Step 3: Create the success;
  yield put({
    type: ReduxActionTypes.INIT_SUCCESS,
  });
}

export function* initializeAppViewerSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  yield put(initBindingMapListener());
  yield all([put(fetchPageList()), put(fetchActions())]);
  yield all([
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
  ]);
  yield put({
    type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
    payload: action.payload,
  });
  yield take(ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS);
  yield put({
    type: ReduxActionTypes.INIT_SUCCESS,
  });
}

export default function* watchInitSagas() {
  yield all([
    takeLatest(ReduxActionTypes.INIT_EDITOR, initializeEditorSaga),
    takeLatest(
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      initializeAppViewerSaga,
    ),
  ]);
}
