import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/types";

export interface CheckoutRefRequestParams {
  refType: "branch" | "tag";
  refName: string;
  message?: string;
}

export type CheckoutRefResponseData = GitArtifact;

export type CheckoutRefResponse = ApiResponse<CheckoutRefResponseData>;
