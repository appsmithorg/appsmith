import type { ApiResponse } from "api/types";

export interface FetchMergeStatusRequestParams {
  sourceBranch: string;
  destinationBranch: string;
}

export interface FetchMergeStatusResponseData {
  isMergeAble: boolean;
  status: string; // merge status
  message: string;
}

export type FetchMergeStatusResponse =
  ApiResponse<FetchMergeStatusResponseData>;
