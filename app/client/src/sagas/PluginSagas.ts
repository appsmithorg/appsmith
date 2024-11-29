import { all, takeEvery, call, put, select } from "redux-saga/effects";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { DefaultPlugin, PluginFormPayload } from "api/PluginApi";
import PluginsApi from "api/PluginApi";
import { validateResponse } from "sagas/ErrorSagas";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import {
  getActions,
  getDatasources,
  getPlugin,
  getPluginForm,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import type { Datasource } from "entities/Datasource";
import type { Plugin } from "api/PluginApi";
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
import type { ApiResponse } from "api/ApiResponses";
import PluginApi from "api/PluginApi";
import log from "loglevel";
import {
  getAppsmithAIPlugin,
  getGraphQLPlugin,
  PluginType,
} from "entities/Action";
import type {
  FormEditorConfigs,
  FormSettingsConfigs,
  FormDependencyConfigs,
  FormDatasourceButtonConfigs,
} from "utils/DynamicBindingUtils";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import { getFromServerWhenNoPrefetchedResult } from "./helper";

function* fetchPluginsSaga(
  action: ReduxAction<
    { workspaceId?: string; plugins?: ApiResponse<Plugin[]> } | undefined
  >,
) {
  try {
    const plugins = action.payload?.plugins;
    let workspaceId: string = yield select(getCurrentWorkspaceId);

    if (action.payload?.workspaceId) workspaceId = action.payload?.workspaceId;

    if (!workspaceId) {
      throw Error("Workspace id does not exist");
    }

    const pluginsResponse: ApiResponse<Plugin[]> = yield call(
      getFromServerWhenNoPrefetchedResult,
      plugins,
      () => call(PluginsApi.fetchPlugins, workspaceId),
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

function* fetchPluginFormConfigsSaga(action?: {
  payload?: { pluginFormConfigs?: ApiResponse<PluginFormPayload[]> };
}) {
  const pluginFormConfigs = action?.payload?.pluginFormConfigs;

  try {
    const datasources: Datasource[] = yield select(getDatasources);
    const plugins: Plugin[] = yield select(getPlugins);
    // Add plugins of all the datasources of their workspace
    const pluginIdFormsToFetch = new Set(
      datasources.map((datasource) => datasource.pluginId),
    );
    // Add the api plugin id by default as API, JS, Graphql can exists without datasource
    const apiPlugin = plugins.find((plugin) => plugin.type === PluginType.API);
    const jsPlugin = plugins.find((plugin) => plugin.type === PluginType.JS);
    const graphqlPlugin = getGraphQLPlugin(plugins);
    const appsmithAIPlugin = getAppsmithAIPlugin(plugins);

    if (
      /* @ts-expect-error: Types are not available */
      typeof window.Cypress?.log === "function"
    ) {
      /* @ts-expect-error: Types are not available */
      window.Cypress.log({
        message: `fetchPluginFormConfigsSaga, ${apiPlugin ? JSON.stringify(apiPlugin) : " No apiPlugin "} ${apiPlugin && defaultActionSettings[apiPlugin.type] ? JSON.stringify(defaultActionSettings[apiPlugin.type] || {}) : " No apiPlugin settings"}`,
      });
    }

    if (apiPlugin) {
      pluginIdFormsToFetch.add(apiPlugin.id);
    }

    if (graphqlPlugin) {
      pluginIdFormsToFetch.add(graphqlPlugin.id);
    }

    if (appsmithAIPlugin) {
      pluginIdFormsToFetch.add(appsmithAIPlugin.id);
    }

    const actions: ActionDataState = yield select(getActions);
    const actionPluginIds = actions.map((action) => action.config.pluginId);

    for (const pluginId of actionPluginIds) {
      pluginIdFormsToFetch.add(pluginId);
    }

    const pluginCalls = [...pluginIdFormsToFetch].map((id) =>
      call(
        getFromServerWhenNoPrefetchedResult,
        // Set the data if it exists in the prefetched data
        // This is to avoid making a call to the server for the data
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pluginFormConfigs?.data?.[id as any]
          ? {
              ...pluginFormConfigs,
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: pluginFormConfigs?.data?.[id as any],
            }
          : undefined,
        // If the data does not exist in the prefetched data, make a call to the server
        () => call(PluginsApi.fetchFormConfig, id),
      ),
    );

    const pluginFormResponses: ApiResponse<PluginFormPayload>[] =
      yield all(pluginCalls);

    const pluginFormData: PluginFormPayload[] = [];

    for (let i = 0; i < pluginFormResponses.length; i++) {
      const response = pluginFormResponses[i];

      yield validateResponse(response);
      pluginFormData.push(response.data);
    }

    if (jsPlugin) {
      pluginIdFormsToFetch.add(jsPlugin.id);
    }

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        if (!!pluginFormData[index]) {
          formConfigs[pluginId] = pluginFormData[index].form;

          // Action editor form if not available use default
          if (plugin && !pluginFormData[index].editor) {
            editorConfigs[pluginId] = defaultActionEditorConfigs[plugin.type];
          } else {
            editorConfigs[pluginId] = pluginFormData[index].editor;
          }

          if (
            /* @ts-expect-error: Types are not available */
            typeof window.Cypress?.log === "function" &&
            plugin?.type === PluginType.API
          ) {
            /* @ts-expect-error: Types are not available */
            window.Cypress.log({
              message: `fetchPluginFormConfigsSaga, ${JSON.stringify(pluginFormData[index].setting || {})} ${JSON.stringify(defaultActionSettings[plugin.type] || {})}`,
            });
          }

          // Action settings form if not available use default
          if (plugin && !pluginFormData[index].setting) {
            settingConfigs[pluginId] = defaultActionSettings[plugin.type];
          } else {
            settingConfigs[pluginId] = pluginFormData[index].setting;
          }

          // Action dependencies config if not available use default
          if (plugin && !pluginFormData[index].dependencies) {
            dependencies[pluginId] =
              defaultActionDependenciesConfig[plugin.type];
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
      const formConfigResponse: ApiResponse<PluginFormPayload> =
        yield PluginApi.fetchFormConfig(pluginId);

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

interface GetPluginFormConfigParams {
  id: string;
  type: string;
}

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
