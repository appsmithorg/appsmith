import type { ApiResponse } from "api/types";

export interface FetchSSHKeyResponseData {
  publicKey: string;
  docUrl: string;
  isRegeneratedKey: boolean;
  regeneratedKey: boolean;
}

export type FetchSSHKeyResponse = ApiResponse<FetchSSHKeyResponseData>;
