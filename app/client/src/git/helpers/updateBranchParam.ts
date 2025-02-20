import { GIT_BRANCH_QUERY_KEY } from "git/constants/misc";
import history from "utils/history";

export const updateBranchParam = (branch: string) => {
  const url = new URL(window.location.href);

  url.searchParams.set(GIT_BRANCH_QUERY_KEY, encodeURIComponent(branch));

  const newUrl = url.toString().slice(url.origin.length);

  history.replace(newUrl);
};
