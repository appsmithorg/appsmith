import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { EvaluatedPopupState } from "reducers/uiReducers/editorContextReducer";

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

export const generateKeyAndSetCodeEditorLastFocus = (
  key: string | undefined,
) => {
  return {
    type: ReduxActionTypes.GENERATE_KEY_AND_SET_CODE_EDITOR_LAST_FOCUS,
    payload: { key },
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
