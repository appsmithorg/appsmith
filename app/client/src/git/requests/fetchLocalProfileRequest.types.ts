import type { ApiResponse } from "api/types";

export interface FetchLocalProfileResponseData {
  authorName: string;
  authorEmail: string;
  useGlobalProfile: boolean;
}

export type FetchLocalProfileResponse =
  ApiResponse<FetchLocalProfileResponseData>;
