import type { Link } from ".";
import * as Constants from "../../constants";
import fsPromises from "fs/promises";

export function checkAvailableBackupSpace(availSpaceInBytes: number) {
  if (availSpaceInBytes < Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES) {
    throw new Error(
      "Not enough space available at /appsmith-stacks. Please ensure availability of at least 2GB to backup successfully.",
    );
  }
}

export class DiskSpaceLink implements Link {
  async preBackup() {
    const availSpaceInBytes: number =
      await getAvailableBackupSpaceInBytes("/appsmith-stacks");

    checkAvailableBackupSpace(availSpaceInBytes);
  }
}

export async function getAvailableBackupSpaceInBytes(
  path: string,
): Promise<number> {
  const stat = await fsPromises.statfs(path);

  return stat.bsize * stat.bfree;
}
