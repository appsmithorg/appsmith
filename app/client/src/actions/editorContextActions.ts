import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import {
  CodeEditorContext,
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

export const setCodeEditorLastFocus = (key: string | undefined) => {
  return {
    type: ReduxActionTypes.SET_CODE_EDITOR_FOCUS,
    payload: { key },
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
