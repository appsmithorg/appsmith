export interface FetchMergeStatusRequestParams {
  sourceBranch: string;
  destinationBranch: string;
}

export interface FetchMergeStatusResponse {
  isMergeAble: boolean;
  status: string; // merge status
  message: string;
}
