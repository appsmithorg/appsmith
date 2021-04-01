import { all, takeEvery, call, put, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import PluginsApi, { PluginFormPayload } from "api/PluginApi";
import { validateResponse } from "sagas/ErrorSagas";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import {
  getDatasources,
  getPlugin,
  getPluginForm,
  getPlugins,
} from "selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import {
  fetchPluginFormConfigsSuccess,
  fetchPluginFormConfigSuccess,
} from "actions/pluginActions";
import {
  defaultActionEditorConfigs,
  defaultActionSettings,
} from "constants/AppsmithActionConstants/ActionConstants";
import { GenericApiResponse } from "api/ApiResponses";
import PluginApi from "api/PluginApi";
import log from "loglevel";

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
    const plugins: Plugin[] = yield select(getPlugins);
    const pluginIds = new Set(
      datasources.map((datasource) => datasource.pluginId),
    );
    const pluginFormRequests = [];
    for (const id of pluginIds) {
      pluginFormRequests.push(yield call(PluginsApi.fetchFormConfig, id));
    }
    const pluginFormData: PluginFormPayload[] = [];
    const pluginFormResponses = yield all(pluginFormRequests);
    for (const response of pluginFormResponses) {
      yield validateResponse(response);
      pluginFormData.push(response.data);
    }

    const formConfigs: Record<string, any[]> = {};
    const editorConfigs: Record<string, any[]> = {};
    const settingConfigs: Record<string, any[]> = {};

    Array.from(pluginIds).forEach((pluginId, index) => {
      const plugin = plugins.find((plugin) => plugin.id === pluginId);
      formConfigs[pluginId] = pluginFormData[index].form;
      if (plugin && !pluginFormData[index].editor) {
        editorConfigs[pluginId] = defaultActionEditorConfigs[plugin.type];
      } else {
        editorConfigs[pluginId] = pluginFormData[index].editor;
      }
      if (plugin && !pluginFormData[index].setting) {
        settingConfigs[pluginId] = defaultActionSettings[plugin.type];
      } else {
        settingConfigs[pluginId] = pluginFormData[index].setting;
      }
    });

    yield put(
      fetchPluginFormConfigsSuccess({
        formConfigs,
        editorConfigs,
        settingConfigs,
      }),
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR,
      payload: { error },
    });
  }
}

export function* checkAndGetPluginFormConfigsSaga(pluginId: string) {
  try {
    const plugin: Plugin = yield select(getPlugin, pluginId);
    const formConfig = yield select(getPluginForm, pluginId);
    if (!formConfig) {
      const formConfigResponse: GenericApiResponse<PluginFormPayload> = yield PluginApi.fetchFormConfig(
        pluginId,
      );
      yield validateResponse(formConfigResponse);
      if (!formConfigResponse.data.setting) {
        formConfigResponse.data.setting = defaultActionSettings[plugin.type];
      }
      if (!formConfigResponse.data.editor) {
        formConfigResponse.data.editor =
          defaultActionEditorConfigs[plugin.type];
      }
      yield put(
        fetchPluginFormConfigSuccess({
          id: pluginId,
          ...formConfigResponse.data,
        }),
      );
    }
  } catch (e) {
    log.error("Failed to get plugin form");
  }
}

function* root() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_PLUGINS_REQUEST, fetchPluginsSaga),
    takeEvery(
      ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_REQUEST,
      fetchPluginFormConfigsSaga,
    ),
  ]);
}

export default root;
