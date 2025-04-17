import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type {
  DefaultPlugin,
  Plugin,
  UpcomingIntegration,
} from "entities/Plugin";
import type {
  PluginFormPayloadWithId,
  PluginFormsPayload,
  GetPluginFormConfigRequest,
} from "actions/pluginActions";
import type {
  FormEditorConfigs,
  FormSettingsConfigs,
  FormDependencyConfigs,
  FormDatasourceButtonConfigs,
} from "utils/DynamicBindingUtils";

export interface PluginDataState {
  list: Plugin[];
  defaultPluginList: DefaultPlugin[];
  loading: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formConfigs: Record<string, any[]>;
  editorConfigs: FormEditorConfigs;
  settingConfigs: FormSettingsConfigs;
  dependencies: FormDependencyConfigs;
  datasourceFormButtonConfigs: FormDatasourceButtonConfigs;
  fetchingSinglePluginForm: Record<string, boolean>;
  fetchingDefaultPlugins: boolean;
  upcomingPlugins: {
    list: UpcomingIntegration[];
    loading: boolean;
  };
}

const initialState: PluginDataState = {
  list: [],
  defaultPluginList: [],
  loading: false,
  formConfigs: {},
  editorConfigs: {},
  settingConfigs: {},
  datasourceFormButtonConfigs: {},
  dependencies: {},
  fetchingSinglePluginForm: {},
  fetchingDefaultPlugins: false,
  upcomingPlugins: {
    list: [],
    loading: false,
  },
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
      datasourceFormButtonConfigs: {
        ...state.datasourceFormButtonConfigs,
        [action.payload.id]: action.payload.formButton,
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
  [ReduxActionTypes.GET_DEFAULT_PLUGINS_REQUEST]: (state: PluginDataState) => {
    return {
      ...state,
      fetchingDefaultPlugins: true,
    };
  },
  [ReduxActionTypes.GET_DEFAULT_PLUGINS_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<DefaultPlugin[]>,
  ) => {
    return {
      ...state,
      fetchingDefaultPlugins: false,
      defaultPluginList: action.payload,
    };
  },
  [ReduxActionTypes.GET_UPCOMING_PLUGINS_REQUEST]: (state: PluginDataState) => {
    return {
      ...state,
      upcomingPlugins: { ...state.upcomingPlugins, loading: true },
    };
  },
  [ReduxActionTypes.GET_UPCOMING_PLUGINS_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<UpcomingIntegration[]>,
  ) => {
    return {
      ...state,
      upcomingPlugins: {
        ...state.upcomingPlugins,
        loading: false,
        list: action.payload,
      },
    };
  },
  [ReduxActionErrorTypes.GET_UPCOMING_PLUGINS_ERROR]: (
    state: PluginDataState,
  ) => {
    return {
      ...state,
      upcomingPlugins: { ...state.upcomingPlugins, loading: false },
    };
  },
});

export default pluginsReducer;
