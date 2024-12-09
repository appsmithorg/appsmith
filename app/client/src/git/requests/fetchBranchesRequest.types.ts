export interface FetchBranchesRequestParams {
  pruneBranches: boolean;
}

interface SingleBranch {
  branchName: string;
  createdFromLocal: string;
  default: boolean;
}

export type FetchBranchesResponse = SingleBranch[];
