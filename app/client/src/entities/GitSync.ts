export enum GitSyncModalTab {
  GIT_CONNECTION = "GIT_CONNECTION",
  DEPLOY = "DEPLOY",
  MERGE = "MERGE",
  SETTINGS = "SETTINGS",
}

export interface GitConfig {
  authorName: string;
  authorEmail: string;
  useGlobalProfile?: boolean;
}

export interface Branch {
  branchName: string;
  default: boolean;
}

export interface MergeStatus {
  isMergeAble: boolean;
  conflictingFiles: Array<string>;
  status?: string;
  message?: string;
  referenceDoc?: string;
}
