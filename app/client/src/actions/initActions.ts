import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { BuilderRouteParams } from "constants/routes";

export type InitializeEditorPayload = BuilderRouteParams & {
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
