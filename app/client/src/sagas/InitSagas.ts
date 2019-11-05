import { all, select, put, takeLatest, take } from "redux-saga/effects";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import {
  getPropertyPaneConfigsId,
  getCurrentPageId,
} from "../selectors/editorSelectors";
import { fetchEditorConfigs } from "../actions/configsActions";
import { fetchPage, fetchPageList } from "../actions/pageActions";
import { fetchActions } from "../actions/actionActions";
import { fetchResources } from "../actions/resourcesActions";
import { createUpdateBindingsMap } from "../actions/bindingActions";

function* fetchAppDataSaga() {
  // Step 1: Start getting all the data needed by the app
  const propertyPaneConfigsId = yield select(getPropertyPaneConfigsId);
  const currentPageId = yield select(getCurrentPageId);
  yield all([
    put(fetchPageList()),
    put(fetchEditorConfigs(propertyPaneConfigsId)),
    put(fetchPage(currentPageId)),
    put(fetchActions()),
    put(fetchResources()),
  ]);
  // Step 2: Wait for all data to be in the state
  yield all([
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.UPDATE_CANVAS),
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
    take(ReduxActionTypes.FETCH_RESOURCES_SUCCESS),
  ]);
  // Step 3: Create the bindings map;
  yield put(createUpdateBindingsMap());
}

export default function* watchInitSagas() {
  yield all([takeLatest(ReduxActionTypes.INIT_APP_DATA, fetchAppDataSaga)]);
}
