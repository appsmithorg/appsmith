import type { GitBranch, GitRef } from "git/types";
import refToBranch from "./refToBranch";

export default function refToBranchList(refs: GitRef[]): GitBranch[] {
  return refs.map(refToBranch);
}
