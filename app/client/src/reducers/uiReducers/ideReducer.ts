import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { klona } from "klona";
import { get, remove, set } from "lodash";

export const IDETabsDefaultValue = {
  [EditorEntityTab.JS]: [],
  [EditorEntityTab.QUERIES]: [],
};

const initialState: IDEState = {
  view: EditorViewMode.FullScreen,
  tabs: {},
  showCreateModal: false,
};

const ideReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE]: (
    state: IDEState,
    action: ReduxAction<{ view: EditorViewMode }>,
  ) => ({ ...state, view: action.payload.view }),
  [ReduxActionTypes.SET_IDE_JS_TABS]: (
    state: IDEState,
    action: ReduxAction<{ tabs: string[]; parentId: string }>,
  ) => {
    set(
      state,
      `tabs.${action.payload.parentId}.${EditorEntityTab.JS}`,
      action.payload.tabs,
    );
  },
  [ReduxActionTypes.SET_IDE_QUERIES_TABS]: (
    state: IDEState,
    action: ReduxAction<{ tabs: string[]; parentId: string }>,
  ) => {
    set(
      state,
      `tabs.${action.payload.parentId}.${EditorEntityTab.QUERIES}`,
      action.payload.tabs,
    );
  },
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
    action: ReduxAction<{ id: string; parentId: string }>,
  ) => {
    const tabs = get(
      state,
      ["tabs", action.payload.parentId, EditorEntityTab.JS],
      [] as string[],
    );
    remove(tabs, (tab) => tab === action.payload.id);
  },
  [ReduxActionTypes.CLOSE_QUERY_ACTION_TAB_SUCCESS]: (
    state: IDEState,
    action: ReduxAction<{ id: string; parentId: string }>,
  ) => {
    const tabs = get(
      state,
      ["tabs", action.payload.parentId, EditorEntityTab.QUERIES],
      [] as string[],
    );
    remove(tabs, (tab) => tab === action.payload.id);
  },
});

export interface IDEState {
  view: EditorViewMode;
  tabs: ParentEntityIDETabs;
  showCreateModal: boolean;
}

export interface ParentEntityIDETabs {
  [parentId: string]: IDETabs;
}

export interface IDETabs {
  [EditorEntityTab.JS]: string[];
  [EditorEntityTab.QUERIES]: string[];
}

export default ideReducer;
