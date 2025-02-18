import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  GitAsyncErrorPayload,
  GitAsyncSuccessPayload,
  GitGlobalReduxState,
} from "../types";
import type {
  GitImportRequestParams,
  GitImportResponseData,
} from "git/requests/gitImportRequest.types";

export interface GitImportInitPayload extends GitImportRequestParams {}

export const gitImportInitAction = (
  state: GitGlobalReduxState,
  // need this here to preserve interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: PayloadAction<GitImportInitPayload>,
) => {
  state.gitImport.loading = true;
  state.gitImport.error = null;

  return state;
};

export type GitImportSuccessPayload =
  GitAsyncSuccessPayload<GitImportResponseData>;

export const gitImportSuccessAction = (
  state: GitGlobalReduxState,
  // need this here to preserve interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: PayloadAction<GitImportSuccessPayload>,
) => {
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
