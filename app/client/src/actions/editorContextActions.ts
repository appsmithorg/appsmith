import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import {
  CursorPosition,
  EvaluatedPopupState,
} from "reducers/uiReducers/editorContextReducer";

export const setFocusableField = (path: string | undefined) => {
  return {
    type: ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD,
    payload: { path },
  };
};

export const generateKeyAndSetFocusableField = (path: string | undefined) => {
  return {
    type: ReduxActionTypes.GENERATE_KEY_AND_SET_FOCUSABLE_PROPERTY_FIELD,
    payload: { path },
  };
};

export const generateKeyAndSetCodeEditorCursorPosition = (
  key: string | undefined,
  cursorPosition: CursorPosition,
) => {
  return {
    type: ReduxActionTypes.GENERATE_KEY_AND_SET_CODE_EDITOR_CURSOR_POSITION,
    payload: { key, cursorPosition },
  };
};

export const generateKeyAndSetEvalPopupState = (
  key: string | undefined,
  evalPopupState: EvaluatedPopupState,
) => {
  return {
    type: ReduxActionTypes.GENERATE_KEY_AND_SET_EVAL_POPUP_STATE,
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

export const setSelectedPropertyTabIndex = (selectedIndex: number) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX,
    payload: selectedIndex,
  };
};

export const setCanvasDebuggerSelectedTab = (selectedTab: string) => {
  return {
    type: ReduxActionTypes.SET_CANVAS_DEBUGGER_SELECTED_TAB,
    payload: selectedTab,
  };
};
