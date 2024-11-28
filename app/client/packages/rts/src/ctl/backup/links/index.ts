export interface Link {
  // Called before the backup folder is created.
  preBackup?(): Promise<void>;

  // Called after backup folder is created. Expected to copy/create any backup files in the backup folder.
  doBackup?(): Promise<void>;

  // Called after backup archive is created. The archive location is available now.
  postBackup?(): Promise<void>;
}

export { EncryptionLink } from "./EncryptionLink";
export { ManifestLink } from "./ManifestLink";
