import { type GitResetRequestDTO } from "src/types/git.dto";
import { ResetMode, simpleGit } from "simple-git";
import log from "loglevel";

export async function reset(request: GitResetRequestDTO) {
  const { repoPath } = request;

  const git = simpleGit(repoPath);

  log.info("Resetting git repository: " + repoPath);
  await git.reset(ResetMode.HARD);
  log.info("Cleaning git repository: " + repoPath);
  await git.clean("f", ["-d"]);
  log.info("Git repository reset successfully: " + repoPath);

  return {};
}
