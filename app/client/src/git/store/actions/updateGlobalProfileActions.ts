import type { UpdateGlobalProfileRequestParams } from "git/requests/updateGlobalProfileRequest.types";
import type { GitAsyncErrorPayload, GitConfigReduxState } from "../types";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UpdateGlobalProfileInitPayload
  extends UpdateGlobalProfileRequestParams {}

type UpdateGlobalProfileInitAction = (
  state: GitConfigReduxState,
  action: PayloadAction<UpdateGlobalProfileInitPayload>,
) => GitConfigReduxState;

export const updateGlobalProfileInitAction: UpdateGlobalProfileInitAction = (
  state,
) => {
  state.updateGlobalProfile.loading = true;
  state.updateGlobalProfile.error = null;

  return state;
};

export const updateGlobalProfileSuccessAction = (
  state: GitConfigReduxState,
) => {
  state.updateGlobalProfile.loading = false;

  return state;
};

export const updateGlobalProfileErrorAction = (
  state: GitConfigReduxState,
  action: PayloadAction<GitAsyncErrorPayload>,
) => {
  const { error } = action.payload;

  state.updateGlobalProfile.loading = false;
  state.updateGlobalProfile.error = error;

  return state;
};
