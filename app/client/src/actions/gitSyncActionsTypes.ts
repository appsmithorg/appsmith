export interface GitStatusData {
  aheadCount: number;
  behindCount: number;
  conflicting: Array<string>;
  isClean: boolean;
  modified: Array<string>;
  modifiedPages: number;
  modifiedQueries: number;
  remoteBranch: string;
  modifiedJSObjects: number;
  modifiedDatasources: number;
  modifiedJSLibs: number;
  discardDocUrl?: string;
  migrationMessage?: string;
}

export interface SSHKeyType {
  keySize: number;
  platFormSupported: string;
  protocolName: string;
}

export interface GetSSHKeyResponseData {
  gitSupportedSSHKeyType: SSHKeyType[];
  docUrl: string;
  publicKey?: string;
}

export enum GitSettingsTab {
  GENERAL = "GENERAL",
  BRANCH = "BRANCH",
  CD = "CD",
}
