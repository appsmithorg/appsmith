import type { EditorViewMode } from "ee/entities/IDE/constants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ParentEntityIDETabs } from "../reducers/uiReducers/ideReducer";

export const setIdeEditorViewMode = (mode: EditorViewMode) => {
  return {
    type: ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE,
    payload: {
      view: mode,
    },
  };
};

export const restoreIDEEditorViewMode = () => {
  return {
    type: ReduxActionTypes.RESTORE_IDE_EDITOR_VIEW_MODE,
  };
};

export const setIDETabs = (payload: ParentEntityIDETabs) => {
  return {
    type: ReduxActionTypes.SET_IDE_TABS,
    payload,
  };
};

export const setJSTabs = (tabs: string[], parentId: string) => {
  return {
    type: ReduxActionTypes.SET_IDE_JS_TABS,
    payload: { tabs, parentId },
  };
};

export const setQueryTabs = (tabs: string[], parentId: string) => {
  return {
    type: ReduxActionTypes.SET_IDE_QUERIES_TABS,
    payload: { tabs, parentId },
  };
};
export const setShowQueryCreateNewModal = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_SHOW_QUERY_CREATE_NEW_MODAL,
    payload,
  };
};

export const recordAnalyticsForSideBySideWidgetHover = (
  widgetType: string,
) => ({
  type: ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_WIDGET_HOVER,
  payload: widgetType,
});

export const sendAnalyticsForSideBySideHover = () => ({
  type: ReduxActionTypes.SEND_ANALYTICS_FOR_SIDE_BY_SIDE_HOVER,
});

export const recordAnalyticsForSideBySideNavigation = () => ({
  type: ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_NAVIGATION,
});

export const resetAnalyticsForSideBySideHover = () => ({
  type: ReduxActionTypes.RESET_ANALYTICS_FOR_SIDE_BY_SIDE_HOVER,
});

export const setListViewActiveState = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_IS_LIST_VIEW_ACTIVE,
    payload,
  };
};

export const setRenameEntity = (id: string) => {
  return {
    type: ReduxActionTypes.SET_RENAME_ENTITY,
    payload: id,
  };
};
