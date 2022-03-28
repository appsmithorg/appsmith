export enum GitSyncModalTab {
  GIT_CONNECTION,
  DEPLOY,
  MERGE,
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
