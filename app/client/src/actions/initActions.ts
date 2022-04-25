import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";

export type InitializeEditorPayload = {
  applicationId?: string;
  pageId?: string;
  branch?: string;
};

export const initEditor = (
  payload: InitializeEditorPayload,
): ReduxAction<InitializeEditorPayload> => ({
  type: ReduxActionTypes.INITIALIZE_EDITOR,
  payload,
});

export const resetEditorRequest = () => ({
  type: ReduxActionTypes.RESET_EDITOR_REQUEST,
});

export const resetEditorSuccess = () => ({
  type: ReduxActionTypes.RESET_EDITOR_SUCCESS,
});
