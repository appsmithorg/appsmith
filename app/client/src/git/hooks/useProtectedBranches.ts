import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectFetchProtectedBranchesState,
  selectUpdateProtectedBranchesState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

function useProtectedBranches() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const fetchProtectedBranchesState = useSelector((state: GitRootState) =>
    selectFetchProtectedBranchesState(state, artifactDef),
  );

  const fetchProtectedBranches = useCallback(() => {
    dispatch(gitArtifactActions.fetchProtectedBranchesInit(artifactDef));
  }, [dispatch, artifactDef]);

  const updateProtectedBranchesState = useSelector((state: GitRootState) =>
    selectUpdateProtectedBranchesState(state, artifactDef),
  );

  const updateProtectedBranches = useCallback(
    (branches: string[]) => {
      dispatch(
        gitArtifactActions.updateProtectedBranchesInit({
          ...artifactDef,
          branchNames: branches,
        }),
      );
    },
    [dispatch, artifactDef],
  );

  return {
    protectedBranches: fetchProtectedBranchesState.value,
    isFetchProtectedBranchesLoading: fetchProtectedBranchesState.loading,
    fetchProtectedBranchesError: fetchProtectedBranchesState.error,
    fetchProtectedBranches,
    isUpdateProtectedBranchesLoading: updateProtectedBranchesState.loading,
    updateProtectedBranchesError: updateProtectedBranchesState.error,
    updateProtectedBranches,
  };
}

export default useProtectedBranches;
