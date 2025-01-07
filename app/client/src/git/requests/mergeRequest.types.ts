import type { ApiResponse } from "api/types";

export interface MergeRequestParams {
  sourceBranch: string;
  destinationBranch: string;
}

export interface MergeResponseData {
  isMergAble: boolean;
  status: string; // merge status
}

export type MergeResponse = ApiResponse<MergeResponseData>;
