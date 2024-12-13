import useGitDefaultBranchEE from "ee/git/hooks/useGitDefaultBranch";
import { useGitContext } from "git/components/GitContextProvider";
import { selectDefaultBranch } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useMemo } from "react";
import { useSelector } from "react-redux";

function useGitDefaultBranch() {
  const { artifactType, baseArtifactId } = useGitContext();

  const artifactDef = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );

  const defaultBranch = useSelector((state: GitRootState) =>
    selectDefaultBranch(state, artifactDef),
  );

  const useGitDefaultBranchEEValues = useGitDefaultBranchEE();

  return {
    defaultBranch: defaultBranch ?? null,
    ...useGitDefaultBranchEEValues,
  };
}

export default useGitDefaultBranch;
