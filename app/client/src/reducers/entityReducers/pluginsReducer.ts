import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { Plugin } from "api/PluginApi";

export interface PluginFormPayload {
  id: string;
  form: [];
  editor: [];
}

export interface PluginDataState {
  list: Plugin[];
  loading: boolean;
  formConfigs: Record<string, []>;
  editorConfigs: Record<string, []>;
  loadingFormConfigs: boolean;
}

const initialState: PluginDataState = {
  list: [],
  loading: false,
  formConfigs: {},
  editorConfigs: {},
  loadingFormConfigs: false,
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
  [ReduxActionTypes.FETCH_PLUGINS_ERROR]: (state: PluginDataState) => {
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
});

export default pluginsReducer;
