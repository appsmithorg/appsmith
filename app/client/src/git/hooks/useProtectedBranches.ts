import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectFetchProtectedBranchesState,
  selectProtectedMode,
  selectUpdateProtectedBranchesState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useDispatch, useSelector } from "react-redux";

function useProtectedBranches() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const fetchProtectedBranchesState = useSelector((state: GitRootState) =>
    selectFetchProtectedBranchesState(state, artifactDef),
  );

  const fetchProtectedBranches = () => {
    dispatch(gitArtifactActions.fetchProtectedBranchesInit(artifactDef));
  };

  const updateProtectedBranchesState = useSelector((state: GitRootState) =>
    selectUpdateProtectedBranchesState(state, artifactDef),
  );

  const updateProtectedBranches = (branches: string[]) => {
    dispatch(
      gitArtifactActions.updateProtectedBranchesInit({
        ...artifactDef,
        branchNames: branches,
      }),
    );
  };

  const isProtectedMode = useSelector((state: GitRootState) =>
    selectProtectedMode(state, artifactDef),
  );

  return {
    protectedBranches: fetchProtectedBranchesState.value,
    isFetchProtectedBranchesLoading: fetchProtectedBranchesState.loading,
    fetchProtectedBranchesError: fetchProtectedBranchesState.error,
    fetchProtectedBranches,
    isUpdateProtectedBranchesLoading: updateProtectedBranchesState.loading,
    updateProtectedBranchesError: updateProtectedBranchesState.error,
    updateProtectedBranches,
    isProtectedMode,
  };
}

export default useProtectedBranches;
