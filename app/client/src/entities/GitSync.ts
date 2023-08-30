export enum GitSyncModalTab {
  GIT_CONNECTION_V2 = "GIT_CONNECTION_V2",
  GIT_CONNECTION = "GIT_CONNECTION",
  DEPLOY = "DEPLOY",
  MERGE = "MERGE",
  SETTINGS = "SETTINGS",
}

export type GitConfig = {
  authorName: string;
  authorEmail: string;
  useGlobalProfile?: boolean;
};

export type Branch = {
  branchName: string;
  default: boolean;
};

export type MergeStatus = {
  isMergeAble: boolean;
  conflictingFiles: Array<string>;
  status?: string;
  message?: string;
  referenceDoc?: string;
};
