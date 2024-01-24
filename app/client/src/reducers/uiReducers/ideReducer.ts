import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";

const initialState: IDEState = {
  view: EditorViewMode.FullScreen,
  pagesActive: false,
  tabs: {
    [EditorEntityTab.JS]: [],
    [EditorEntityTab.QUERIES]: [],
  },
};

const ideReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE]: (
    state: IDEState,
    action: ReduxAction<{ view: EditorViewMode }>,
  ) => ({ ...state, view: action.payload.view }),
  [ReduxActionTypes.SET_IDE_EDITOR_PAGES_ACTIVE_STATUS]: (
    state: IDEState,
    action: ReduxAction<{ pagesActive: boolean }>,
  ) => ({ ...state, pagesActive: action.payload.pagesActive }),
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
});

export interface IDEState {
  view: EditorViewMode;
  pagesActive: boolean;
  tabs: {
    [EditorEntityTab.JS]: string[];
    [EditorEntityTab.QUERIES]: string[];
  };
}

export default ideReducer;
