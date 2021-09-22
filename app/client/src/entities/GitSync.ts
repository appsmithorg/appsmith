export enum GitSyncModalTab {
  GIT_CONNECTION,
  DEPLOY,
  MERGE,
}

export type GitConfig = {
  authorName: string;
  authorEmail: string;
};

export type LocalGitConfig = {
  authorName: string;
  authorEmail: string;
};
