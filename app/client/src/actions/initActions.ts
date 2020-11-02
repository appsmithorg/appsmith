import {
  ReduxActionTypes,
  ReduxAction,
  InitializeEditorPayload,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

export const initEditor = (
  applicationId: string,
  pageId: string,
): ReduxAction<InitializeEditorPayload> => ({
  type: ReduxActionTypes.INITIALIZE_EDITOR,
  payload: {
    applicationId,
    pageId,
  },
});

export const initEditorError = (): ReduxAction<{ show: false }> => ({
  type: ReduxActionErrorTypes.INITIALIZE_EDITOR_ERROR,
  payload: {
    show: false,
  },
});
