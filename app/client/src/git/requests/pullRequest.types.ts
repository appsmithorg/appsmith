import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/types";

export interface PullResponseData {
  artifact: GitArtifact;
  mergeStatus: {
    isMergeAble: boolean;
    status: string; // pull merge status
  };
}

export type PullResponse = ApiResponse<PullResponseData>;
