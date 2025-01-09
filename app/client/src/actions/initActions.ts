import type { APP_MODE } from "entities/App";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const initCurrentPage = () => {
  return {
    type: ReduxActionTypes.INITIALIZE_CURRENT_PAGE,
  };
};

export interface InitEditorActionPayload {
  baseApplicationId?: string;
  basePageId?: string;
  branch?: string;
  mode: APP_MODE;
  shouldInitialiseUserDetails?: boolean;
}

export const initEditorAction = (
  payload: InitEditorActionPayload,
): ReduxAction<InitEditorActionPayload> => ({
  type: ReduxActionTypes.INITIALIZE_EDITOR,
  payload,
});

export interface InitAppViewerPayload {
  branch: string;
  baseApplicationId?: string;
  basePageId: string;
  mode: APP_MODE;
  shouldInitialiseUserDetails?: boolean;
}

export const initAppViewerAction = ({
  baseApplicationId,
  basePageId,
  branch,
  mode,
  shouldInitialiseUserDetails,
}: InitAppViewerPayload) => ({
  type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
  payload: {
    branch: branch,
    baseApplicationId,
    basePageId,
    mode,
    shouldInitialiseUserDetails,
  },
});

export const resetEditorRequest = () => ({
  type: ReduxActionTypes.RESET_EDITOR_REQUEST,
});

export const resetEditorSuccess = () => ({
  type: ReduxActionTypes.RESET_EDITOR_SUCCESS,
});
