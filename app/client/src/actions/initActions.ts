import {
  ReduxActionTypes,
  ReduxAction,
  InitializeEditorPayload,
} from "constants/ReduxActionConstants";

export const initEditor = (
  defaultApplicationId: string,
  pageId: string,
  branchName?: string,
): ReduxAction<InitializeEditorPayload> => ({
  type: ReduxActionTypes.INITIALIZE_EDITOR,
  payload: {
    defaultApplicationId,
    pageId,
    branchName,
  },
});

export const resetEditorRequest = () => ({
  type: ReduxActionTypes.RESET_EDITOR_REQUEST,
});

export const resetEditorSuccess = () => ({
  type: ReduxActionTypes.RESET_EDITOR_SUCCESS,
});
