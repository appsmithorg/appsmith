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

export type CodeEditorState = Record<string, CodeEditorContext>;

const initialState: CodeEditorState = {};

export const codeEditorContextReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_CODE_EDITOR_CURSOR_POSITION]: (
    state: CodeEditorState,
    action: {
      payload: { key: string; cursorPosition: CursorPosition };
    },
  ) => {
    const { cursorPosition, key } = action.payload;
    if (!key) return;
    if (!state[key]) state[key] = {};
    state[key].cursorPosition = cursorPosition;
  },
  [ReduxActionTypes.SET_EVAL_POPUP_STATE]: (
    state: CodeEditorState,
    action: { payload: { key: string; evalPopupState: EvaluatedPopupState } },
  ) => {
    const { evalPopupState, key } = action.payload;
    if (!key) return;
    if (!state[key]) state[key] = {};
    state[key].evalPopupState = evalPopupState;
  },
});
