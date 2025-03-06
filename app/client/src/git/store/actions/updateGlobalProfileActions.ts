import type { UpdateGlobalProfileRequestParams } from "git/requests/updateGlobalProfileRequest.types";
import type { GitAsyncErrorPayload, GitGlobalReduxState } from "../types";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UpdateGlobalProfileInitPayload
  extends UpdateGlobalProfileRequestParams {}

type UpdateGlobalProfileInitAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<UpdateGlobalProfileInitPayload>,
) => GitGlobalReduxState;

export const updateGlobalProfileInitAction: UpdateGlobalProfileInitAction = (
  state,
) => {
  state.updateGlobalProfile.loading = true;
  state.updateGlobalProfile.error = null;

  return state;
};

export const updateGlobalProfileSuccessAction = (
  state: GitGlobalReduxState,
) => {
  state.updateGlobalProfile.loading = false;

  return state;
};

export const updateGlobalProfileErrorAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<GitAsyncErrorPayload>,
) => {
  const { error } = action.payload;

  state.updateGlobalProfile.loading = false;
  state.updateGlobalProfile.error = error;

  return state;
};
