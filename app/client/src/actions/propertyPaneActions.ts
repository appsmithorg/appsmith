import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { SelectedPropertyPanel } from "reducers/uiReducers/propertyPaneReducer";

export const updateWidgetName = (widgetId: string, newName: string) => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_NAME_INIT,
    payload: {
      id: widgetId,
      newName,
    },
  };
};

export const bindDataToWidget = (payload: {
  widgetId: string;
  bindingQuery?: string;
}) => {
  return {
    type: ReduxActionTypes.BIND_DATA_TO_WIDGET,
    payload,
  };
};

export const setSnipingMode = (payload: {
  isActive: boolean;
  bindTo?: string;
}) => ({
  type: ReduxActionTypes.SET_SNIPING_MODE,
  payload,
});

export const resetSnipingMode = () => ({
  type: ReduxActionTypes.RESET_SNIPING_MODE,
});

export const setPropertyPaneWidthAction = (width: number) => ({
  type: ReduxActionTypes.SET_PROPERTY_PANE_WIDTH,
  payload: width,
});

export const setPropertySectionState = (
  key: string,
  isOpen: boolean,
  panelPropertyPath?: string,
) => {
  return {
    type: ReduxActionTypes.SET_PROPERTY_SECTION_STATE,
    payload: { key, isOpen, panelPropertyPath },
  };
};
export const setAllPropertySectionState = (payload: {
  [key: string]: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_ALL_PROPERTY_SECTION_STATE,
    payload,
  };
};
export const setSelectedPropertyTabIndex = (selectedIndex: number) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX,
    payload: selectedIndex,
  };
};

export const setFocusablePropertyPaneField = (path?: string) => {
  return {
    type: ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD,
    payload: { path },
  };
};

export const setSelectedPropertyPanel = (
  path: string | undefined,
  index: number,
) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PANEL_PROPERTY,
    payload: {
      path,
      index,
    },
  };
};

export const unsetSelectedPropertyPanel = (path: string | undefined) => {
  return {
    type: ReduxActionTypes.UNSET_SELECTED_PANEL_PROPERTY,
    payload: path,
  };
};

export const setSelectedPropertyPanels = (payload: SelectedPropertyPanel) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PANELS,
    payload,
  };
};

export const createNewJSCollectionFromActionCreator = (
  payload: (bindingValue: string) => void,
) => {
  return {
    type: ReduxActionTypes.CREATE_NEW_JS_FROM_ACTION_CREATOR,
    payload,
  };
};

export const createNewQueryFromActionCreator = (
  payload: (bindingValue: string) => void,
) => {
  return {
    type: ReduxActionTypes.CREATE_NEW_QUERY_FROM_ACTION_CREATOR,
    payload,
  };
};

export interface ShowPropertyPanePayload {
  widgetId?: string;
  callForDragOrResize?: boolean;
  force: boolean;
}

export const showPropertyPane = (payload: ShowPropertyPanePayload) => {
  return {
    type: ReduxActionTypes.SHOW_PROPERTY_PANE,
    payload,
  };
};
