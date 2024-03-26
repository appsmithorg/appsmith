import type { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { IDETabs } from "../reducers/uiReducers/ideReducer";

export const setIdeEditorViewMode = (mode: EditorViewMode) => {
  return {
    type: ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE,
    payload: {
      view: mode,
    },
  };
};

export const setIdeEditorPagesActiveStatus = (active: boolean) => {
  return {
    type: ReduxActionTypes.SET_IDE_EDITOR_PAGES_ACTIVE_STATUS,
    payload: {
      pagesActive: active,
    },
  };
};

export const setJSTabs = (tabs: string[]) => {
  return {
    type: ReduxActionTypes.SET_IDE_JS_TABS,
    payload: tabs,
  };
};

export const setQueryTabs = (tabs: string[]) => {
  return {
    type: ReduxActionTypes.SET_IDE_QUERIES_TABS,
    payload: tabs,
  };
};

export const setIDETabs = (tabs: IDETabs) => {
  return {
    type: ReduxActionTypes.SET_IDE_TABS,
    payload: tabs,
  };
};
