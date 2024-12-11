export interface PullResponse {
  mergeStatus: {
    isMergeAble: boolean;
    status: string; // pull merge status
  };
}
