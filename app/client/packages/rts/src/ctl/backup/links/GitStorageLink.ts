import type { Link } from "./index";
import type { BackupState } from "../BackupState";
import * as utils from "../../utils";
import path from "path";

export class GitStorageLink implements Link {
  constructor(private readonly state: BackupState) {}

  async doBackup() {
    await createGitStorageArchive(this.state.backupRootPath);
  }
}

async function createGitStorageArchive(destFolder: string) {
  console.log("Creating git-storage archive");

  const gitRoot = getGitRoot(process.env.APPSMITH_GIT_ROOT);

  await executeCopyCMD(gitRoot, destFolder);

  console.log("Created git-storage archive");
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
