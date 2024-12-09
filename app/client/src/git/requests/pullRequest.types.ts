export interface PullRequestResponse {
  mergeStatus: {
    isMergeAble: boolean;
    status: string; // pull merge status
  };
}
