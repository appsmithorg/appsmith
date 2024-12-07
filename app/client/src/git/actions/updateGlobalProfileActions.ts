import type { GitAsyncErrorPayload, GitConfigReduxState } from "../types";
import type { PayloadAction } from "@reduxjs/toolkit";

export const updateGlobalProfileInitAction = (state: GitConfigReduxState) => {
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
