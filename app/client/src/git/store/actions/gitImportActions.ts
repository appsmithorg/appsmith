import type { PayloadAction } from "@reduxjs/toolkit";
import type { GitAsyncErrorPayload, GitGlobalReduxState } from "../types";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";

export interface GitImportInitPayload extends GitImportRequestParams {}

export const gitImportInitAction = (
  state: GitGlobalReduxState,
  // need type for better import
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: PayloadAction<GitImportInitPayload>,
) => {
  state.gitImport.loading = true;
  state.gitImport.error = null;

  return state;
};

export const gitImportSuccessAction = (state: GitGlobalReduxState) => {
  state.gitImport.loading = false;

  return state;
};

export const gitImportErrorAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<GitAsyncErrorPayload>,
) => {
  const { error } = action.payload;

  state.gitImport.loading = false;
  state.gitImport.error = error;

  return state;
};
