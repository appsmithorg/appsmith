import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { Plugin, PluginIdGenerateCRUDPageEnabled } from "api/PluginApi";
import {
  PluginFormPayloadWithId,
  PluginFormsPayload,
  GetPluginFormConfigRequest,
} from "actions/pluginActions";
import { DependencyMap } from "utils/DynamicBindingUtils";

export interface PluginDataState {
  list: Plugin[];
  loading: boolean;
  formConfigs: Record<string, any[]>;
  editorConfigs: Record<string, any[]>;
  settingConfigs: Record<string, any[]>;
  dependencies: Record<string, DependencyMap>;
  fetchingSinglePluginForm: Record<string, boolean>;
  pluginIdGenerateCRUDPageEnabled: PluginIdGenerateCRUDPageEnabled;
}

const initialState: PluginDataState = {
  list: [],
  loading: false,
  formConfigs: {},
  editorConfigs: {},
  settingConfigs: {},
  dependencies: {},
  fetchingSinglePluginForm: {},
  pluginIdGenerateCRUDPageEnabled: {},
};

const pluginsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PLUGINS_REQUEST]: (state: PluginDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.FETCH_PLUGINS_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<Plugin[]>,
  ) => {
    const list = action.payload;

    const pluginIdGenerateCRUDPageEnabled: PluginIdGenerateCRUDPageEnabled = {};
    list.map((plugin) => {
      if (plugin.generateCRUDPageComponent) {
        pluginIdGenerateCRUDPageEnabled[plugin.id] = plugin.packageName;
      }
    });
    return {
      ...state,
      loading: false,
      list,
      pluginIdGenerateCRUDPageEnabled,
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
  [ReduxActionTypes.GET_PLUGIN_FORM_CONFIG_INIT]: (
    state: PluginDataState,
    action: ReduxAction<GetPluginFormConfigRequest>,
  ) => {
    return {
      ...state,
      fetchingSinglePluginForm: {
        ...state.fetchingSinglePluginForm,
        [action.payload.id]: true,
      },
    };
  },
  [ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<PluginFormPayloadWithId>,
  ) => {
    return {
      ...state,
      fetchingSinglePluginForm: {
        ...state.fetchingSinglePluginForm,
        [action.payload.id]: false,
      },
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
  [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_ERROR]: (
    state: PluginDataState,
    action: ReduxAction<GetPluginFormConfigRequest>,
  ) => {
    return {
      ...state,
      fetchingSinglePluginForm: {
        ...state.fetchingSinglePluginForm,
        [action.payload.id]: false,
      },
    };
  },
});

export default pluginsReducer;
