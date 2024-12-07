import type { FetchGlobalProfileResponseData } from "git/requests/fetchGlobalProfileRequest.types";
import type {
  GitAsyncSuccessPayload,
  GitAsyncErrorPayload,
  GitConfigReduxState,
} from "../types";
import type { PayloadAction } from "@reduxjs/toolkit";

export const fetchGlobalProfileInitAction = (state: GitConfigReduxState) => {
  state.globalProfile.loading = true;
  state.globalProfile.error = null;

  return state;
};

export const fetchGlobalProfileSuccessAction = (
  state: GitConfigReduxState,
  action: PayloadAction<GitAsyncSuccessPayload<FetchGlobalProfileResponseData>>,
) => {
  state.globalProfile.loading = false;
  state.globalProfile.value = action.payload.responseData;

  return state;
};

export const fetchGlobalProfileErrorAction = (
  state: GitConfigReduxState,
  action: PayloadAction<GitAsyncErrorPayload>,
) => {
  const { error } = action.payload;

  state.globalProfile.loading = false;
  state.globalProfile.error = error;

  return state;
};
