import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import {
  CodeEditorContext,
  CursorPosition,
  EvaluatedPopupState,
  PropertyPanelContext,
  SelectedPropertyPanel,
} from "reducers/uiReducers/editorContextReducer";

export const setFocusableField = (path: string | undefined) => {
  return {
    type: ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD,
    payload: { path },
  };
};

export const setSelectedPropertyPanel = (
  selectedPropertyPanel?: SelectedPropertyPanel,
) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PANEL_PROPERTY,
    payload: selectedPropertyPanel,
  };
};

export const setCodeEditorHistory = (codeEditorContext: CodeEditorContext) => {
  return {
    type: ReduxActionTypes.SET_CODE_EDITOR_CURSOR_HISTORY,
    payload: codeEditorContext,
  };
};

export const setCodeEditorCursorPosition = (
  key: string | undefined,
  cursorPosition: CursorPosition,
) => {
  return {
    type: ReduxActionTypes.SET_CODE_EDITOR_CURSOR_POSITION,
    payload: { key, cursorPosition },
  };
};

export const setEvalPopupState = (
  key: string | undefined,
  evalPopupState: EvaluatedPopupState,
) => {
  return {
    type: ReduxActionTypes.SET_EVAL_POPUP_STATE,
    payload: { key, evalPopupState },
  };
};

export const setPropertySectionState = (key: string, isOpen: boolean) => {
  return {
    type: ReduxActionTypes.SET_PROPERTY_SECTION_STATE,
    payload: { key, isOpen },
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

export const setSelectedPropertyTabIndex = (
  selectedIndex: number,
  isPanelProperty?: boolean,
) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX,
    payload: { index: selectedIndex, isPanelProperty },
  };
};

export const setCanvasDebuggerSelectedTab = (selectedTab: string) => {
  return {
    type: ReduxActionTypes.SET_CANVAS_DEBUGGER_SELECTED_TAB,
    payload: selectedTab,
  };
};

export const setPanelFocusableField = (path: string, panelName: string) => {
  return {
    type: ReduxActionTypes.SET_PANEL_FOCUSABLE_PROPERTY_FIELD,
    payload: { path, panelName },
  };
};

export const setPanelSelectedPropertyTabIndex = (
  index: number,
  panelName: string,
) => {
  return {
    type: ReduxActionTypes.SET_PANEL_SELECTED_PROPERTY_TAB_INDEX,
    payload: { index, panelName },
  };
};

export const setPanelPropertySectionState = (
  key: string,
  isOpen: boolean,
  panelName: string,
) => {
  return {
    type: ReduxActionTypes.SET_PANEL_PROPERTY_SECTION_STATE,
    payload: { key, isOpen, panelName },
  };
};

export const setWidgetFocusableField = (path: string) => {
  return {
    type: ReduxActionTypes.SET_WIDGET_FOCUSABLE_PROPERTY_FIELD,
    payload: { path },
  };
};

export const setWidgetSelectedPropertyTabIndex = (index: number) => {
  return {
    type: ReduxActionTypes.SET_WIDGET_SELECTED_PROPERTY_TAB_INDEX,
    payload: { index },
  };
};

export const setWidgetPropertySectionState = (key: string, isOpen: boolean) => {
  return {
    type: ReduxActionTypes.SET_WIDGET_PROPERTY_SECTION_STATE,
    payload: { key, isOpen },
  };
};

export const setPanelPropertiesState = (
  propertyPanelContext: PropertyPanelContext,
) => {
  return {
    type: ReduxActionTypes.SET_PANEL_PROPERTIES_STATE,
    payload: propertyPanelContext,
  };
};
