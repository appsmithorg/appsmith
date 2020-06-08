import { all, takeEvery, call, put, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import PluginsApi from "api/PluginApi";
import { validateResponse } from "sagas/ErrorSagas";
import { getCurrentOrgId } from "selectors/organizationSelectors";

function* fetchPluginsSaga() {
  try {
    const orgId = yield select(getCurrentOrgId);
    const pluginsResponse = yield call(PluginsApi.fetchPlugins, orgId);
    const isValid = yield validateResponse(pluginsResponse);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
        payload: pluginsResponse.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
      payload: { error },
    });
  }
}

function* fetchPluginFormSaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
    const response = yield call(
      PluginsApi.fetchFormConfig,
      actionPayload.payload.id,
    );
    const isValid = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS,
        payload: {
          id: actionPayload.payload.id,
          form: response.data.form,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PLUGIN_FORM_ERROR,
      payload: { error },
    });
  }
}

function* root() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_PLUGINS_REQUEST, fetchPluginsSaga),
    takeEvery(ReduxActionTypes.FETCH_PLUGIN_FORM_INIT, fetchPluginFormSaga),
  ]);
}

export default root;
