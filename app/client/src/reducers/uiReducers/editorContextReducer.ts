import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type CursorPosition = {
  line: number;
  ch: number;
};

export type EvaluatedPopupState = {
  type: boolean;
  example: boolean;
  value: boolean;
};

export type CodeEditorContext = {
  cursorPosition?: CursorPosition;
  evalPopupState?: EvaluatedPopupState;
};

export type CodeEditorHistory = Record<string, CodeEditorContext>;

export type EditorContextState = {
  focusableField?: string;
  codeEditorHistory: Record<string, CodeEditorContext>;
};

const initialState: EditorContextState = {
  codeEditorHistory: {},
};

export const editorContextReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD]: (
    state: EditorContextState,
    action: {
      payload: { path: string };
    },
  ) => {
    const { path } = action.payload;
    state.focusableField = path;
  },
  [ReduxActionTypes.SET_CODE_EDITOR_CURSOR_POSITION]: (
    state: EditorContextState,
    action: {
      payload: { key: string; cursorPosition: CursorPosition };
    },
  ) => {
    const { cursorPosition, key } = action.payload;
    if (!key) return;
    if (!state.codeEditorHistory[key]) state.codeEditorHistory[key] = {};
    state.codeEditorHistory[key].cursorPosition = cursorPosition;
    state.focusableField = key;
  },
  [ReduxActionTypes.SET_EVAL_POPUP_STATE]: (
    state: EditorContextState,
    action: { payload: { key: string; evalPopupState: EvaluatedPopupState } },
  ) => {
    const { evalPopupState, key } = action.payload;
    if (!key) return;
    if (!state.codeEditorHistory[key]) state.codeEditorHistory[key] = {};
    state.codeEditorHistory[key].evalPopupState = evalPopupState;
  },
});
