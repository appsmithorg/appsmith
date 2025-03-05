import type { ApiResponse } from "api/types";

export interface PretagResponseData {
  author: {
    name: string;
    email: string;
  };
  committedAt: string;
  hash: string;
  message: string;

  releaseTagName: string;
  releasedAt: string;
  isReleasable: boolean;
}

export type PretagResponse = ApiResponse<PretagResponseData>;
