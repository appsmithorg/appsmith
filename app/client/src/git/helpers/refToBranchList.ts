import type { GitBranch, GitRef } from "git/types";

export default function refToBranchList(refs: GitRef[]): GitBranch[] {
  return refs.map((ref) => ({
    branchName: ref.refName,
    default: ref.default,
  }));
}
