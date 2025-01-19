import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/store/types";

export interface DeleteRefRequestParams {
  refType: "branch" | "tag";
  refName: string;
}

export type DeleteRefResponseData = GitArtifact;

export type DeleteRefResponse = ApiResponse<DeleteRefResponseData>;
