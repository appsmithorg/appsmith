import type { ApiResponse } from "api/types";

export interface DisconnectResponseData {
  [key: string]: string;
}

export type DisconnectResponse = ApiResponse<DisconnectResponseData>;
