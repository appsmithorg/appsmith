import type { ApiResponse } from "api/types";

export interface UpdateGlobalProfileRequestParams {
  authorName: string;
  authorEmail: string;
}

export interface UpdateGlobalProfileResponseData {
  default: {
    authorName: string;
    authorEmail: string;
  };
}

export type UpdateGlobalProfileResponse =
  ApiResponse<UpdateGlobalProfileResponseData>;
