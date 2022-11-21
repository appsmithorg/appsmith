import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { EvaluatedPopupState } from "reducers/uiReducers/editorContextReducer";

export const setFocusableCodeEditorField = (path: string | undefined) => {
  return {
    type: ReduxActionTypes.SET_FOCUSABLE_CODE_EDITOR_FIELD,
    payload: { path },
  };
};

export const setCodeEditorCursorHistory = (
  path: string,
  cursorPosition: { ch: number; line: number },
) => {
  return {
    type: ReduxActionTypes.SET_CODE_EDITOR_CURSOR_HISTORY,
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

export const generateKeyAndSetCodeEditorLastFocus = (
  payload: CodeEditorFocusState,
) => {
  return {
    type: ReduxActionTypes.GENERATE_KEY_AND_SET_CODE_EDITOR_LAST_FOCUS,
    payload,
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
