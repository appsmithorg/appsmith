import type { ApiResponse } from "api/types";

export interface FetchRefsRequestParams {
  pruneRefs: boolean;
  refType: "branch" | "tag";
}

interface SingleRef {
  refName: string;
  refType: string;
  createdFromLocal: string;
  default: boolean;
}

export type FetchRefsResponseData = SingleRef[];

export type FetchRefsResponse = ApiResponse<FetchRefsResponseData>;
