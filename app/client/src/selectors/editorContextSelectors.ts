import { AppState } from "@appsmith/reducers";
import {
  CodeEditorHistory,
  CursorPosition,
  EvaluatedPopupState,
} from "reducers/uiReducers/editorContextReducer";
import { createSelector } from "reselect";

export const getFocusableField = (state: AppState) =>
  state.ui.editorContext.focusableField;

export const getCodeEditorHistory = (state: AppState) =>
  state.ui.editorContext.codeEditorHistory;

export const getCodeEditorCursorPosition = createSelector(
  [
    getCodeEditorHistory,
    getFocusableField,
    (_state: AppState, key: string | undefined) => key,
  ],
  (
    codeEditorHistory: CodeEditorHistory,
    focusableField: string | undefined,
    key: string | undefined,
  ): CursorPosition | undefined => {
    return key && focusableField === key
      ? codeEditorHistory?.[key]?.cursorPosition
      : undefined;
  },
);

export const getEvaluatedPopupState = createSelector(
  [getCodeEditorHistory, (_state: AppState, key: string | undefined) => key],
  (
    codeEditorHistory: CodeEditorHistory,
    key: string | undefined,
  ): EvaluatedPopupState | undefined => {
    return key ? codeEditorHistory?.[key]?.evalPopupState : undefined;
  },
);
