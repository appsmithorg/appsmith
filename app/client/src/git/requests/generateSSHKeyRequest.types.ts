export interface GenerateSSHKeyRequestParams {
  keyType: string;
  isImporting: boolean;
}

export interface GenerateSSHKeyResponse {
  publicKey: string;
  docUrl: string;
  isRegeneratedKey: boolean;
  regeneratedKey: boolean;
}
