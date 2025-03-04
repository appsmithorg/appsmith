import type { ApiResponse } from "api/types";

export interface FetchLatestCommitResponseData {
  authorName: string;
  committedAt: string;
  hash: string;
  message: string;
  releaseTagName: string;
  releasedAt: string;
}

export type FetchLatestCommitResponse =
  ApiResponse<FetchLatestCommitResponseData>;
