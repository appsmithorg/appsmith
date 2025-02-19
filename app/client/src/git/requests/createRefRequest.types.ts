import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/types";

export interface CreateRefRequestParams {
  refType: "branch" | "tag";
  refName: string;
}

export type CreateRefResponseData = GitArtifact;

export type CreateRefResponse = ApiResponse<CreateRefResponseData>;
