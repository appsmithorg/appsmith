export interface MergeRequestParams {
  sourceBranch: string;
  destinationBranch: string;
}

export interface MergeResponse {
  isMergAble: boolean;
  status: string; // merge status
}
