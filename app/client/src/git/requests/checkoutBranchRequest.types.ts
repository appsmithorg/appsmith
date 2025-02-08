import type { ApiResponse } from "api/types";
import type { ApplicationPayload } from "entities/Application";

export interface CheckoutBranchRequestParams {
  branchName: string;
}

export interface CheckoutBranchResponseData extends ApplicationPayload {}

export type CheckoutBranchResponse = ApiResponse<CheckoutBranchResponseData>;
