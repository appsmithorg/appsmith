import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "constants/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { JSCollection } from "entities/JSCollection";
import { ActionExecutionResizerHeight } from "PluginActionEditor/components/PluginActionResponse/constants";

export enum JSEditorTab {
  CODE = "CODE",
  SETTINGS = "SETTINGS",
}

export interface JSPaneDebuggerState {
  open: boolean;
  responseTabHeight: number;
  selectedTab?: string;
}

export interface JsPaneReduxState {
  isCreating: boolean;
  isSaving: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  selectedConfigTab: JSEditorTab;
  debugger: JSPaneDebuggerState;
}

const initialState: JsPaneReduxState = {
  isCreating: false,
  isSaving: {},
  isDeleting: {},
  isDirty: {},
  selectedConfigTab: JSEditorTab.CODE,
  debugger: {
    open: false,
    responseTabHeight: ActionExecutionResizerHeight,
  },
};

const jsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_JS_ACTIONS_INIT]: (state: JsPaneReduxState) => ({
    ...state,
    isFetching: true,
  }),
  [ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS]: (state: JsPaneReduxState) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR]: (
    state: JsPaneReduxState,
  ) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionTypes.CREATE_JS_ACTION_INIT]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: true,
  }),
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionTypes.JS_ACTION_SAVE_START]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.JS_ACTION_SAVE_COMPLETE]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: false,
    },
    isDirty: {
      ...state.isDirty,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_JS_ACTION_BODY_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ data: JSCollection }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_JS_ACTION_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ data: JSCollection }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionErrorTypes.REFACTOR_JS_ACTION_NAME_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ collectionId: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.collectionId]: false,
    },
  }),
  [ReduxActionTypes.DELETE_JS_ACTION_SUCCESS]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionErrorTypes.DELETE_JS_ACTION_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.SET_JS_PANE_CONFIG_SELECTED_TAB]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ selectedTab: JSEditorTab }>,
  ) => {
    const { selectedTab } = action.payload;

    return {
      ...state,
      selectedConfigTab: selectedTab,
    };
  },
  [ReduxActionTypes.SET_JS_PANE_DEBUGGER_STATE]: (
    state: JsPaneReduxState,
    action: ReduxAction<Partial<JSPaneDebuggerState>>,
  ) => {
    return {
      ...state,
      debugger: {
        ...state.debugger,
        ...action.payload,
      },
    };
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: (state: JsPaneReduxState) => {
    return {
      ...state,
      isSaving: false,
    };
  },
});

export default jsPaneReducer;
