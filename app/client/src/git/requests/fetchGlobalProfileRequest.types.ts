import type { ApiResponse } from "api/types";

export interface FetchGlobalProfileResponseData {
  authorName: string;
  authorEmail: string;
}

export type FetchGlobalProfileResponse =
  ApiResponse<FetchGlobalProfileResponseData>;
