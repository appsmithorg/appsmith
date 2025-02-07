import type { ApiResponse } from "api/types";

export interface CommitRequestParams {
  message: string;
  doPush: boolean;
}

export type CommitResponseData = string;

export type CommitResponse = ApiResponse<CommitResponseData>;
