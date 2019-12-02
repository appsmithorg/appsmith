import { all, takeEvery, call, put } from "redux-saga/effects";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import PluginsApi from "api/PluginApi";
import { validateResponse } from "sagas/ErrorSagas";

function* fetchPluginsSaga() {
  try {
    const pluginsResponse = yield call(PluginsApi.fetchPlugins);
    const isValid = yield validateResponse(pluginsResponse);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
        payload: pluginsResponse.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionTypes.FETCH_PLUGINS_ERROR,
      payload: { error },
    });
  }
}

function* root() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_PLUGINS_REQUEST, fetchPluginsSaga),
  ]);
}

export default root;
