import type { ApiResponse } from "api/types";
import type { GitRef } from "git/types";

export interface FetchRefsRequestParams {
  pruneRefs: boolean;
  refType: "branch" | "tag";
}

export type FetchRefsResponseData = GitRef[];

export type FetchRefsResponse = ApiResponse<FetchRefsResponseData>;
