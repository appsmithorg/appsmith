import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export type CodeEditorBlurredPayload = {
  name: string;
  cursorPosition: { line: number; ch: number };
};

export const codeEditorBlurred = (payload: CodeEditorBlurredPayload) => {
  return {
    type: ReduxActionTypes.CODE_EDITOR_BLURRED,
    payload,
  };
};
