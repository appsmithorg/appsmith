import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { klona } from "klona";

export const IDETabsDefaultValue = {
  [EditorEntityTab.JS]: [],
  [EditorEntityTab.QUERIES]: [],
};

const initialState: IDEState = {
  view: EditorViewMode.FullScreen,
  tabs: IDETabsDefaultValue,
  showCreateModal: false,
};

const ideReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE]: (
    state: IDEState,
    action: ReduxAction<{ view: EditorViewMode }>,
  ) => ({ ...state, view: action.payload.view }),
  [ReduxActionTypes.SET_IDE_JS_TABS]: (
    state: IDEState,
    action: ReduxAction<string[]>,
  ): IDEState => ({
    ...state,
    tabs: { ...state.tabs, [EditorEntityTab.JS]: action.payload },
  }),
  [ReduxActionTypes.SET_IDE_QUERIES_TABS]: (
    state: IDEState,
    action: ReduxAction<string[]>,
  ): IDEState => ({
    ...state,
    tabs: { ...state.tabs, [EditorEntityTab.QUERIES]: action.payload },
  }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: IDEState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    tabs: {
      ...state.tabs,
      [EditorEntityTab.QUERIES]: state.tabs[EditorEntityTab.QUERIES].filter(
        (tab) => tab !== action.payload.id,
      ),
    },
  }),
  [ReduxActionTypes.DELETE_JS_ACTION_SUCCESS]: (
    state: IDEState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    tabs: {
      ...state.tabs,
      [EditorEntityTab.JS]: state.tabs[EditorEntityTab.JS].filter(
        (tab) => tab !== action.payload.id,
      ),
    },
  }),
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
  [ReduxActionTypes.SET_SHOW_QUERY_CREATE_NEW_MODAL]: (
    state: IDEState,
    action: {
      payload: boolean;
    },
  ) => {
    return {
      ...state,
      showCreateModal: action.payload,
    };
  },
  [ReduxActionTypes.CLOSE_JS_ACTION_TAB_SUCCESS]: (
    state: IDEState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    tabs: {
      ...state.tabs,
      [EditorEntityTab.JS]: state.tabs[EditorEntityTab.JS].filter(
        (tab) => tab !== action.payload.id,
      ),
    },
  }),
  [ReduxActionTypes.CLOSE_QUERY_ACTION_TAB_SUCCESS]: (
    state: IDEState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    tabs: {
      ...state.tabs,
      [EditorEntityTab.QUERIES]: state.tabs[EditorEntityTab.QUERIES].filter(
        (tab) => tab !== action.payload.id,
      ),
    },
  }),
});

export interface IDEState {
  view: EditorViewMode;
  tabs: IDETabs;
  showCreateModal: boolean;
}

export interface IDETabs {
  [EditorEntityTab.JS]: string[];
  [EditorEntityTab.QUERIES]: string[];
}

export default ideReducer;
