import type { GitBranch, GitRef } from "git/types";

export default function refToBranch(ref: GitRef): GitBranch {
  return {
    branchName: ref.refName,
    default: ref.default,
  };
}
