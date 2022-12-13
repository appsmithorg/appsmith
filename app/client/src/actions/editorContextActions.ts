import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  CodeEditorContext,
  EvaluatedPopupState,
  PropertyPanelContext,
} from "reducers/uiReducers/editorContextReducer";

export const setFocusableInputField = (path: string | undefined) => {
  return {
    type: ReduxActionTypes.SET_FOCUSABLE_INPUT_FIELD,
    payload: { path },
  };
};

export const setCodeEditorCursorAction = (
  path: string,
  cursorPosition: { ch: number; line: number },
) => {
  return {
    type: ReduxActionTypes.SET_CODE_EDITOR_CURSOR,
    payload: { cursorPosition, path },
  };
};

export type CodeEditorFocusState = {
  key: string | undefined;
  cursorPosition: {
    ch: number;
    line: number;
  };
};

export const setEditorFieldFocusAction = (payload: CodeEditorFocusState) => {
  return {
    type: ReduxActionTypes.SET_EDITOR_FIELD_FOCUS,
    payload,
  };
};

export const setCodeEditorHistory = (codeEditorHistory: {
  [key: string]: CodeEditorContext;
}) => {
  return {
    type: ReduxActionTypes.SET_CODE_EDITOR_CURSOR_HISTORY,
    payload: codeEditorHistory,
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
  panelPropertyPath?: string,
) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX,
    payload: { index: selectedIndex, panelPropertyPath },
  };
};

export const setCanvasDebuggerSelectedTab = (selectedTab: string) => {
  return {
    type: ReduxActionTypes.SET_CANVAS_DEBUGGER_SELECTED_TAB,
    payload: selectedTab,
  };
};

export const setPanelSelectedPropertyTabIndex = (
  index: number,
  panelPropertyPath: string,
) => {
  return {
    type: ReduxActionTypes.SET_PANEL_SELECTED_PROPERTY_TAB_INDEX,
    payload: { index, panelPropertyPath },
  };
};

export const setPanelPropertySectionState = (
  key: string,
  isOpen: boolean,
  panelPropertyPath: string,
) => {
  return {
    type: ReduxActionTypes.SET_PANEL_PROPERTY_SECTION_STATE,
    payload: { key, isOpen, panelPropertyPath },
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

export const setEntityCollapsibleState = (name: string, isOpen: boolean) => {
  return {
    type: ReduxActionTypes.SET_ENTITY_COLLAPSIBLE_STATE,
    payload: { name, isOpen },
  };
};

export const setAllEntityCollapsibleStates = (payload: {
  [key: string]: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_ALL_ENTITY_COLLAPSIBLE_STATE,
    payload,
  };
};

export const setAllSubEntityCollapsibleStates = (payload: {
  [key: string]: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_ALL_SUB_ENTITY_COLLAPSIBLE_STATE,
    payload,
  };
};

export const setExplorerSwitchIndex = (payload: number) => {
  return {
    type: ReduxActionTypes.SET_EXPLORER_SWITCH_INDEX,
    payload,
  };
};
