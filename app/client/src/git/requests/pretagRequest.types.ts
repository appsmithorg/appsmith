import type { ApiResponse } from "api/types";

export interface PretagResponseData {
  author: {
    name: string;
    email: string;
  };

  commitedAt: number;
  hash: string;
  commitMessage: string;

  releaseTagName: string;
  releasedAt: number;
  isReleasable: boolean;
}

export type PretagResponse = ApiResponse<PretagResponseData>;
