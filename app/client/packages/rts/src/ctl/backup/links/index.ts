export interface Link {
  // Called before the backup folder is created.
  preBackup?(): Promise<void>;

  // Called after backup folder is created. Expected to copy/create any backup files in the backup folder.
  doBackup?(): Promise<void>;

  // Called after backup archive is created. The archive location is available now.
  postBackup?(): Promise<void>;
}

export * from "./BackupFolderLink";
export * from "./DiskSpaceLink";
export * from "./EncryptionLink";
export * from "./EnvFileLink";
export * from "./GitStorageLink";
export * from "./ManifestLink";
export * from "./MongoDumpLink";
