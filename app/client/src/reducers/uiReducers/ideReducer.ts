import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { EditorEntityTab, EditorViewMode } from "ee/entities/IDE/constants";
import { klona } from "klona";
import get from "lodash/get";
import remove from "lodash/remove";
import set from "lodash/set";

export const IDETabsDefaultValue = {
  [EditorEntityTab.JS]: [],
  [EditorEntityTab.QUERIES]: [],
};

const initialState: IDEState = {
  view: EditorViewMode.FullScreen,
  tabs: {},
  isListViewActive: false,
  showCreateModal: false,
  renameEntity: "",
  ideCanvasSideBySideHover: {
    navigated: false,
    widgetTypes: [],
  },
};

const ideReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE]: (
    state: IDEState,
    action: ReduxAction<{ view: EditorViewMode }>,
  ) => ({ ...state, view: action.payload.view }),
  [ReduxActionTypes.SET_IDE_TABS]: (
    state: IDEState,
    action: ReduxAction<ParentEntityIDETabs>,
  ) => {
    set(state, "tabs", action.payload);
  },
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
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: (state: IDEState): IDEState => {
    return klona({
      ...initialState,
      tabs: state.tabs,
    });
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
  [ReduxActionTypes.RESET_ANALYTICS_FOR_SIDE_BY_SIDE_HOVER]: (
    state: IDEState,
  ) => {
    state.ideCanvasSideBySideHover = klona(
      initialState.ideCanvasSideBySideHover,
    );
  },
  [ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_NAVIGATION]: (
    state: IDEState,
  ) => {
    state.ideCanvasSideBySideHover.navigated = true;
  },
  [ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_WIDGET_HOVER]: (
    state: IDEState,
    action: ReduxAction<string>,
  ) => {
    state.ideCanvasSideBySideHover.widgetTypes.push(action.payload);
  },
  [ReduxActionTypes.SET_IS_LIST_VIEW_ACTIVE]: (
    state: IDEState,
    action: {
      payload: boolean;
    },
  ) => {
    state.isListViewActive = action.payload;
  },
  [ReduxActionTypes.SET_RENAME_ENTITY]: (
    state: IDEState,
    action: {
      payload: string;
    },
  ) => {
    state.renameEntity = action.payload;
  },
});

export interface IDEState {
  view: EditorViewMode;
  isListViewActive: boolean;
  tabs: ParentEntityIDETabs;
  showCreateModal: boolean;
  renameEntity: string;
  ideCanvasSideBySideHover: IDECanvasSideBySideHover;
}

export interface ParentEntityIDETabs {
  [parentId: string]: IDETabs;
}

export interface IDETabs {
  [EditorEntityTab.JS]: string[];
  [EditorEntityTab.QUERIES]: string[];
}

export interface IDECanvasSideBySideHover {
  navigated: boolean;
  widgetTypes: string[];
}

export default ideReducer;
