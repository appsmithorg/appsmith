import useDefaultBranchEE from "ee/git/hooks/useDefaultBranch";
import { useGitContext } from "git/components/GitContextProvider";
import { selectDefaultBranch } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useSelector } from "react-redux";

function useDefaultBranch() {
  const { artifactDef } = useGitContext();

  const defaultBranch = useSelector((state: GitRootState) =>
    selectDefaultBranch(state, artifactDef),
  );

  const useDefaultBranchEEValues = useDefaultBranchEE();

  return {
    defaultBranch,
    ...useDefaultBranchEEValues,
  };
}

export default useDefaultBranch;
