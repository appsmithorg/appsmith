import { GIT_BRANCH_QUERY_KEY } from "git/constants/misc";

export default function getBranchParam() {
  const url = new URL(window.location.href);
  const branchName = url.searchParams.get(GIT_BRANCH_QUERY_KEY);

  if (branchName) {
    return decodeURIComponent(branchName) ?? undefined;
  }

  return undefined;
}
