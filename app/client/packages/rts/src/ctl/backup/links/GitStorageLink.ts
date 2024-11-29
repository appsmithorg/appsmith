import type { Link } from ".";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";
import path from "path";

/**
 * Copies the `git-storage` folder to the backup folder.
 */
export class GitStorageLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    console.log("Creating git-storage archive");

    const gitRoot = getGitRoot(process.env.APPSMITH_GIT_ROOT);

    await executeCopyCMD(gitRoot, this.state.backupRootPath);
    console.log("Created git-storage archive");
  }
}

export function getGitRoot(gitRoot?: string | undefined) {
  if (gitRoot == null || gitRoot === "") {
    gitRoot = "/appsmith-stacks/git-storage";
  }

  return gitRoot;
}

export async function executeCopyCMD(srcFolder: string, destFolder: string) {
  return await utils.execCommand([
    "ln",
    "-s",
    srcFolder,
    path.join(destFolder, "git-storage"),
  ]);
}
