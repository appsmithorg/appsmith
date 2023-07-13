export enum GitSyncModalTab {
  GIT_CONNECTION = "GIT_CONNECTION",
  DEPLOY = "DEPLOY",
  MERGE = "MERGE",
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
  conflictingFiles: { filepath: string; resolved: boolean }[];
  status?: string;
  message?: string;
  referenceDoc?: string;
};
