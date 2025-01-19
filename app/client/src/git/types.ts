export interface GitRef {
  refName: string;
  refType: string;
  createdFromLocal: string;
  default: boolean;
}

export interface GitBranch {
  branchName: string;
  default: boolean;
}
