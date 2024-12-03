import { checkAvailableBackupSpace, getAvailableBackupSpaceInBytes } from "..";
import type { Link } from ".";

export class DiskSpaceLink implements Link {
  async preBackup() {
    const availSpaceInBytes: number =
      await getAvailableBackupSpaceInBytes("/appsmith-stacks");

    checkAvailableBackupSpace(availSpaceInBytes);
  }
}
