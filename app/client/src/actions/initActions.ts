import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { AppEnginePayload } from "entities/Engine";

export type InitializeEditorPayload = {
  applicationId?: string;
  pageId?: string;
  branch?: string;
};

export const initEditor = (
  payload: InitializeEditorPayload,
): ReduxAction<AppEnginePayload> => ({
  type: ReduxActionTypes.INITIALIZE_EDITOR,
  payload: {
    ...payload,
    mode: APP_MODE.EDIT,
  },
});

export const resetEditorRequest = () => ({
  type: ReduxActionTypes.RESET_EDITOR_REQUEST,
});

export const resetEditorSuccess = () => ({
  type: ReduxActionTypes.RESET_EDITOR_SUCCESS,
});
