import type { ApiResponse } from "api/types";

export interface UpdateLocalProfileRequestParams {
  authorName: string;
  authorEmail: string;
  useGlobalProfile: boolean;
}

export interface UpdateLocalProfileResponseData {
  [baseApplicationId: string]: {
    authorName: string;
    authorEmail: string;
    useGlobalProfile: boolean;
  };
}

export type UpdateLocalProfileResponse =
  ApiResponse<UpdateLocalProfileResponseData>;
