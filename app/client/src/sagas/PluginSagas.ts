import { all, takeEvery, call, put, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import PluginsApi, { DefaultPlugin, PluginFormPayload } from "api/PluginApi";
import { validateResponse } from "sagas/ErrorSagas";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
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
  fetchPluginFormConfigError,
} from "actions/pluginActions";
import {
  defaultActionDependenciesConfig,
  defaultActionEditorConfigs,
  defaultActionSettings,
  defaultDatasourceFormButtonConfig,
} from "constants/AppsmithActionConstants/ActionConstants";
import { ApiResponse } from "api/ApiResponses";
import PluginApi from "api/PluginApi";
import log from "loglevel";
import { PluginType } from "entities/Action";
import {
  FormEditorConfigs,
  FormSettingsConfigs,
  FormDependencyConfigs,
  FormDatasourceButtonConfigs,
} from "utils/DynamicBindingUtils";

function* fetchPluginsSaga(
  action: ReduxAction<{ workspaceId?: string } | undefined>,
) {
  try {
    let workspaceId: string = yield select(getCurrentWorkspaceId);
    if (action.payload?.workspaceId) workspaceId = action.payload?.workspaceId;

    if (!workspaceId) {
      throw Error("Workspace id does not exist");
    }
    const pluginsResponse: ApiResponse<Plugin[]> = yield call(
      PluginsApi.fetchPlugins,
      workspaceId,
    );
    const isValid: boolean = yield validateResponse(pluginsResponse);
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
    // Add plugins of all the datasources of their workspace
    const pluginIdFormsToFetch = new Set(
      datasources.map((datasource) => datasource.pluginId),
    );
    // Add the api plugin id by default because it is the only type of action that
    // can exist without a saved datasource
    const apiPlugin = plugins.find((plugin) => plugin.type === PluginType.API);
    const jsPlugin = plugins.find((plugin) => plugin.type === PluginType.JS);
    if (apiPlugin) {
      pluginIdFormsToFetch.add(apiPlugin.id);
    }
    const pluginFormData: PluginFormPayload[] = [];
    const pluginFormResponses: ApiResponse<PluginFormPayload>[] = yield all(
      [...pluginIdFormsToFetch].map((id) =>
        call(PluginsApi.fetchFormConfig, id),
      ),
    );
    for (const response of pluginFormResponses) {
      yield validateResponse(response);
      pluginFormData.push(response.data);
    }

    if (jsPlugin) {
      pluginIdFormsToFetch.add(jsPlugin.id);
    }
    const formConfigs: Record<string, any[]> = {};
    const editorConfigs: FormEditorConfigs = {};
    const settingConfigs: FormSettingsConfigs = {};
    const dependencies: FormDependencyConfigs = {};
    const datasourceFormButtonConfigs: FormDatasourceButtonConfigs = {};

    Array.from(pluginIdFormsToFetch).forEach((pluginId, index) => {
      const plugin = plugins.find((plugin) => plugin.id === pluginId);
      if (plugin && plugin.type === PluginType.JS) {
        settingConfigs[pluginId] = defaultActionSettings[plugin.type];
        editorConfigs[pluginId] = defaultActionEditorConfigs[plugin.type];
        formConfigs[pluginId] = [];
        dependencies[pluginId] = defaultActionDependenciesConfig[plugin.type];
      } else {
        // Datasource form always use server's copy
        formConfigs[pluginId] = pluginFormData[index].form;
        // Action editor form if not available use default
        if (plugin && !pluginFormData[index].editor) {
          editorConfigs[pluginId] = defaultActionEditorConfigs[plugin.type];
        } else {
          editorConfigs[pluginId] = pluginFormData[index].editor;
        }
        // Action settings form if not available use default
        if (plugin && !pluginFormData[index].setting) {
          settingConfigs[pluginId] = defaultActionSettings[plugin.type];
        } else {
          settingConfigs[pluginId] = pluginFormData[index].setting;
        }
        // Action dependencies config if not available use default
        if (plugin && !pluginFormData[index].dependencies) {
          dependencies[pluginId] = defaultActionDependenciesConfig[plugin.type];
        } else {
          dependencies[pluginId] = pluginFormData[index].dependencies;
        }
        // Datasource form buttons config if not available use default
        if (plugin && !pluginFormData[index].formButton) {
          datasourceFormButtonConfigs[pluginId] =
            defaultDatasourceFormButtonConfig[plugin.type];
        } else {
          datasourceFormButtonConfigs[pluginId] =
            pluginFormData[index].formButton;
        }
      }
    });
    yield put(
      fetchPluginFormConfigsSuccess({
        formConfigs,
        editorConfigs,
        settingConfigs,
        dependencies,
        datasourceFormButtonConfigs,
      }),
    );
  } catch (error) {
    log.error(error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR,
      payload: { error },
    });
  }
}

export function* checkAndGetPluginFormConfigsSaga(pluginId: string) {
  try {
    const plugin: Plugin = yield select(getPlugin, pluginId);
    const formConfig: Record<string, unknown> = yield select(
      getPluginForm,
      pluginId,
    );
    if (!formConfig) {
      const formConfigResponse: ApiResponse<PluginFormPayload> = yield PluginApi.fetchFormConfig(
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
      if (!formConfigResponse.data.dependencies) {
        formConfigResponse.data.dependencies =
          defaultActionDependenciesConfig[plugin.type];
      }
      if (!formConfigResponse.data.formButton) {
        formConfigResponse.data.formButton =
          defaultDatasourceFormButtonConfig[plugin.type];
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
    yield put(
      fetchPluginFormConfigError({
        id: pluginId,
      }),
    );
  }
}

type GetPluginFormConfigParams = { id: string; type: string };

function* getPluginFormConfig({ id }: GetPluginFormConfigParams) {
  yield call(checkAndGetPluginFormConfigsSaga, id);
}

function* getDefaultPluginsSaga() {
  try {
    const response: ApiResponse<DefaultPlugin> = yield call(
      PluginsApi.fetchDefaultPlugins,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_DEFAULT_PLUGINS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_DEFAULT_PLUGINS_ERROR,
      payload: {
        error,
      },
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
    takeEvery(
      ReduxActionTypes.GET_PLUGIN_FORM_CONFIG_INIT,
      getPluginFormConfig,
    ),
    takeEvery(
      ReduxActionTypes.GET_DEFAULT_PLUGINS_REQUEST,
      getDefaultPluginsSaga,
    ),
  ]);
}

export default root;
