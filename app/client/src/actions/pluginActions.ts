import type {
  ReduxAction,
  ReduxActionWithoutPayload,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { PluginFormPayload } from "api/PluginApi";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { Plugin } from "api/PluginApi";

export const fetchPlugins = (payload?: {
  workspaceId?: string;
  plugins?: ApiResponse<Plugin[]>;
}): ReduxAction<{ workspaceId?: string } | undefined> => ({
  type: ReduxActionTypes.FETCH_PLUGINS_REQUEST,
  payload,
});

export const fetchPluginFormConfigs = (
  pluginFormConfigs?: ApiResponse<PluginFormPayload>[],
): ReduxAction<{
  pluginFormConfigs?: ApiResponse<PluginFormPayload>[];
}> => ({
  type: ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_REQUEST,
  payload: { pluginFormConfigs },
});

export interface PluginFormsPayload {
  formConfigs: Record<string, any[]>;
  editorConfigs: Record<string, any[]>;
  settingConfigs: Record<string, any[]>;
  dependencies: Record<string, DependencyMap>;
  datasourceFormButtonConfigs: Record<string, string[]>;
}

export const fetchPluginFormConfigsSuccess = (
  payload: PluginFormsPayload,
): ReduxAction<PluginFormsPayload> => ({
  type: ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS,
  payload,
});

export interface PluginFormPayloadWithId extends PluginFormPayload {
  id: string;
}

export const fetchPluginFormConfigSuccess = (
  payload: PluginFormPayloadWithId,
): ReduxAction<PluginFormPayloadWithId> => ({
  type: ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS,
  payload,
});

export const fetchPluginFormConfigError = (
  payload: GetPluginFormConfigRequest,
): ReduxAction<GetPluginFormConfigRequest> => ({
  type: ReduxActionErrorTypes.FETCH_PLUGIN_FORM_ERROR,
  payload,
});

export interface GetPluginFormConfigRequest {
  id: string;
}

// To fetch plugin form config for individual plugin
export const fetchPluginFormConfig = ({
  pluginId: id,
}: {
  pluginId: GetPluginFormConfigRequest;
}) => ({
  type: ReduxActionTypes.GET_PLUGIN_FORM_CONFIG_INIT,
  payload: id,
});

export const fetchDefaultPlugins = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.GET_DEFAULT_PLUGINS_REQUEST,
});
