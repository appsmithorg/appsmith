import type { ApiResponse } from "api/types";

export interface GenerateSSHKeyRequestParams {
  keyType: string;
  isImport: boolean;
}

export interface GenerateSSHKeyResponseData {
  publicKey: string;
  docUrl: string;
  isRegeneratedKey: boolean;
  regeneratedKey: boolean;
}

export type GenerateSSHKeyResponse = ApiResponse<GenerateSSHKeyResponseData>;
