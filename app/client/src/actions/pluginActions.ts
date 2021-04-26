import {
  ReduxAction,
  ReduxActionTypes,
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
