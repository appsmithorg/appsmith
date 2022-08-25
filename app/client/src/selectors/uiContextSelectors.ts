import { AppState } from "reducers";
import {
  CodeEditorState,
  CursorPosition,
  EvaluatedPopupState,
} from "reducers/uiReducers/codeEditorContextReducer";
import { createSelector } from "reselect";

export const getCodeEditorState = (state: AppState) =>
  state.ui.codeEditorContext;

export const getCodeEditorCursorPosition = createSelector(
  [getCodeEditorState, (_state: AppState, key: string | undefined) => key],
  (
    codeEditorState: CodeEditorState,
    key: string | undefined,
  ): CursorPosition | undefined => {
    return key ? codeEditorState?.[key]?.cursorPosition : undefined;
  },
);

export const getEvaluatedPopupState = createSelector(
  [getCodeEditorState, (_state: AppState, key: string | undefined) => key],
  (
    codeEditorState: CodeEditorState,
    key: string | undefined,
  ): EvaluatedPopupState | undefined => {
    return key ? codeEditorState?.[key]?.evalPopupState : undefined;
  },
);
