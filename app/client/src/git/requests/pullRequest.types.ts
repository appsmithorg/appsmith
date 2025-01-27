import type { ApiResponse } from "api/types";

export interface PullResponseData {
  mergeStatus: {
    isMergeAble: boolean;
    status: string; // pull merge status
  };
}

export type PullResponse = ApiResponse<PullResponseData>;
