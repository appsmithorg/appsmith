import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { Plugin } from "api/PluginApi";

export interface PluginFormPayload {
  id: string;
  form: any[];
  editor: any[];
}

export interface PluginDataState {
  list: Plugin[];
  loading: boolean;
  formConfigs: Record<string, any[]>;
  editorConfigs: Record<string, any[]>;
  loadingFormConfigs: boolean;
  loadingDBFormConfigs: boolean;
}

const initialState: PluginDataState = {
  list: [],
  loading: false,
  formConfigs: {},
  editorConfigs: {},
  loadingFormConfigs: false,
  loadingDBFormConfigs: false,
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
  [ReduxActionTypes.FETCH_PLUGIN_FORM_INIT]: (state: PluginDataState) => {
    return {
      ...state,
      loadingFormConfigs: true,
    };
  },
  [ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS]: (
    state: PluginDataState,
    action: ReduxAction<PluginFormPayload>,
  ) => {
    return {
      ...state,
      loadingFormConfigs: false,
      formConfigs: {
        ...state.formConfigs,
        [action.payload.id]: action.payload.form,
      },
      editorConfigs: {
        ...state.editorConfigs,
        [action.payload.id]: action.payload.editor,
      },
    };
  },
  [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_ERROR]: (state: PluginDataState) => {
    return {
      ...state,
      loadingFormConfigs: false,
    };
  },
  [ReduxActionTypes.FETCH_DB_PLUGIN_FORMS_INIT]: (state: PluginDataState) => {
    return {
      ...state,
      loadingDBFormConfigs: true,
    };
  },
  [ReduxActionTypes.FETCH_DB_PLUGIN_FORMS_SUCCESS]: (
    state: PluginDataState,
  ) => {
    return {
      ...state,
      loadingDBFormConfigs: false,
    };
  },
  [ReduxActionErrorTypes.FETCH_DB_PLUGIN_FORMS_ERROR]: (
    state: PluginDataState,
  ) => {
    return {
      ...state,
      loadingDBFormConfigs: false,
    };
  },
});

export default pluginsReducer;
