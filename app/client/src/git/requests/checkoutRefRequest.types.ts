import type { ApiResponse } from "api/types";
import type { ApplicationPayload } from "entities/Application";

export interface CheckoutRefRequestParams {
  refType: "branch" | "tag";
  refName: string;
}

export interface CheckoutRefResponseData extends ApplicationPayload {}

export type CheckoutRefResponse = ApiResponse<CheckoutRefResponseData>;
