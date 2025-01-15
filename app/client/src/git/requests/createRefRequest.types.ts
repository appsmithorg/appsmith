import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/store/types";

export interface CreateRefRequestParams {
  refType: string;
  refName: string;
}

export type CreateRefResponseData = GitArtifact;

export type CreateRefResponse = ApiResponse<CreateRefResponseData>;
