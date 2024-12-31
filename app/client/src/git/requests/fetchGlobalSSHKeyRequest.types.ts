import type { ApiResponse } from "api/types";

export interface FetchGlobalSSHKeyRequestParams {
  keyType: string;
}

export interface FetchGlobalSSHKeyResponseData {
  publicKey: string;
  docUrl: string;
  isRegeneratedKey: boolean;
  regeneratedKey: boolean;
}

export type FetchGlobalSSHKeyResponse =
  ApiResponse<FetchGlobalSSHKeyResponseData>;
