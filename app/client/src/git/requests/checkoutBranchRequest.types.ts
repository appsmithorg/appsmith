import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/types";

export interface CheckoutBranchRequestParams {
  branchName: string;
}

export type CheckoutBranchResponseData = GitArtifact;

export type CheckoutBranchResponse = ApiResponse<CheckoutBranchResponseData>;
