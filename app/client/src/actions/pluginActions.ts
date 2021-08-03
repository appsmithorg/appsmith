import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxActionWithoutPayload,
} from "constants/ReduxActionConstants";
import { PluginFormPayload } from "api/PluginApi";
import { DependencyMap } from "utils/DynamicBindingUtils";

export const fetchPlugins = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.FETCH_PLUGINS_REQUEST,
});

export const fetchPluginFormConfigs = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_REQUEST,
});

export type PluginFormsPayload = {
  formConfigs: Record<string, any[]>;
  editorConfigs: Record<string, any[]>;
  settingConfigs: Record<string, any[]>;
  dependencies: Record<string, DependencyMap>;
};

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
