import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { CodeEditorBlurredPayload } from "actions/codeEditorActions";

export type CodeEditorState = {
  name: string;
  cursorPosition: {
    line: number;
    ch: number;
  };
};

const initialState: CodeEditorState = {
  name: "",
  cursorPosition: {
    line: 0,
    ch: 0,
  },
};

const codeEditorReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.CODE_EDITOR_BLURRED]: (
    state: CodeEditorState,
    action: {
      payload: CodeEditorBlurredPayload;
    },
  ) => {
    const { cursorPosition, name } = action.payload;
    state.cursorPosition = cursorPosition;
    state.name = name;
  },
});

export default codeEditorReducer;
