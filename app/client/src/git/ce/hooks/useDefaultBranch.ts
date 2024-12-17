import { useGitContext } from "git/components/GitContextProvider";
import { selectDefaultBranch } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useSelector } from "react-redux";

function useDefaultBranch() {
  const { artifactDef } = useGitContext();

  const defaultBranch = useSelector((state: GitRootState) =>
    selectDefaultBranch(state, artifactDef),
  );

  return {
    defaultBranch,
  };
}

export default useDefaultBranch;
