import {
  ReduxActionTypes,
  ReduxAction,
  InitializeEditorPayload,
} from "constants/ReduxActionConstants";

export const initEditor = (
  applicationId: string,
  pageId: string,
  branch?: string,
): ReduxAction<InitializeEditorPayload> => ({
  type: ReduxActionTypes.INITIALIZE_EDITOR,
  payload: {
    applicationId,
    pageId,
    branch,
  },
});

export const resetEditorRequest = () => ({
  type: ReduxActionTypes.RESET_EDITOR_REQUEST,
});

export const resetEditorSuccess = () => ({
  type: ReduxActionTypes.RESET_EDITOR_SUCCESS,
});
