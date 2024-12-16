import type { ApiResponse } from "api/types";

export interface CommitRequestParams {
  commitMessage: string;
  doPush: boolean;
}

export type CommitResponseData = string;

export type CommitResponse = ApiResponse<CommitResponseData>;
