import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { Plugin } from "api/PluginApi";
import {
  PluginFormPayloadWithId,
  PluginFormsPayload,
} from "actions/pluginActions";
import { DependencyMap } from "utils/DynamicBindingUtils";

export interface PluginDataState {
  list: Plugin[];
  loading: boolean;
  formConfigs: Record<string, any[]>;
  editorConfigs: Record<string, any[]>;
  settingConfigs: Record<string, any[]>;
  dependencies: Record<string, DependencyMap>;
}

const initialState: PluginDataState = {
  list: [],
  loading: false,
  formConfigs: {},
  editorConfigs: {},
  settingConfigs: {},
  dependencies: {},
};

const pluginsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PLUGINS_REQUEST]: (state: PluginDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.FETCH_PLUGINS_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<Plugin[]>,
  ) => {
    return {
      ...state,
      loading: false,
      list: action.payload,
    };
  },
  [ReduxActionErrorTypes.FETCH_PLUGINS_ERROR]: (state: PluginDataState) => {
    return {
      ...state,
      loading: false,
    };
  },
  [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<PluginFormsPayload>,
  ) => {
    return {
      ...state,
      ...action.payload,
    };
  },
  [ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<PluginFormPayloadWithId>,
  ) => {
    return {
      ...state,
      formConfigs: {
        ...state.formConfigs,
        [action.payload.id]: action.payload.form,
      },
      editorConfigs: {
        ...state.editorConfigs,
        [action.payload.id]: action.payload.editor,
      },
      settingConfigs: {
        ...state.settingConfigs,
        [action.payload.id]: action.payload.setting,
      },
    };
  },
});

export default pluginsReducer;
