import { all, takeEvery, call, put, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import PluginsApi from "api/PluginApi";
import { validateResponse } from "sagas/ErrorSagas";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import {
  getDatasources,
  getDBPlugins,
  getPluginForm,
} from "selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";

function* fetchPluginsSaga() {
  try {
    const orgId = yield select(getCurrentOrgId);
    if (!orgId) {
      throw Error("Org id does not exist");
    }
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

function* fetchPluginFormConfigsSaga() {
  try {
    const datasources: Datasource[] = yield select(getDatasources);
    const pluginIds = new Set(
      datasources.map((datasource) => datasource.pluginId),
    );
    const pluginFormRequests = [];
    for (const id of pluginIds) {
      pluginFormRequests.push(yield call(PluginsApi.fetchFormConfig, id));
    }
    const pluginFormResponses = yield all(pluginFormRequests);
    for (const response of pluginFormResponses) {
      yield validateResponse(response);
      yield put({
        type: ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR,
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
          ...response.data,
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

function* fetchDBPluginFormsSaga() {
  try {
    const dbPlugins = yield select(getDBPlugins);

    for (const plugin of dbPlugins) {
      const formConfig = yield select(getPluginForm, plugin.id);

      if (!formConfig) {
        const response = yield call(PluginsApi.fetchFormConfig, plugin.id);
        yield validateResponse(response);
        yield put({
          type: ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS,
          payload: {
            id: plugin.id,
            ...response.data,
          },
        });
      }
    }

    yield put({
      type: ReduxActionTypes.FETCH_DB_PLUGIN_FORMS_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DB_PLUGIN_FORMS_ERROR,
      payload: { error },
    });
  }
}

function* root() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_PLUGINS_REQUEST, fetchPluginsSaga),
    takeEvery(
      ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_REQUEST,
      fetchPluginFormConfigsSaga,
    ),
    takeEvery(ReduxActionTypes.FETCH_PLUGIN_FORM_INIT, fetchPluginFormSaga),
    takeEvery(
      ReduxActionTypes.FETCH_DB_PLUGIN_FORMS_INIT,
      fetchDBPluginFormsSaga,
    ),
  ]);
}

export default root;
