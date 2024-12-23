import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectFetchProtectedBranchesState,
  selectUpdateProtectedBranchesState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

function useProtectedBranches() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const fetchProtectedBranchesState = useArtifactSelector(
    selectFetchProtectedBranchesState,
  );

  const fetchProtectedBranches = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.fetchProtectedBranchesInit({ artifactDef }));
    }
  }, [dispatch, artifactDef]);

  const updateProtectedBranchesState = useArtifactSelector(
    selectUpdateProtectedBranchesState,
  );

  const updateProtectedBranches = useCallback(
    (branches: string[]) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.updateProtectedBranchesInit({
            artifactDef,
            branchNames: branches,
          }),
        );
      }
    },
    [dispatch, artifactDef],
  );

  return {
    protectedBranches: fetchProtectedBranchesState?.value ?? null,
    isFetchProtectedBranchesLoading:
      fetchProtectedBranchesState?.loading ?? false,
    fetchProtectedBranchesError: fetchProtectedBranchesState?.error ?? null,
    fetchProtectedBranches,
    isUpdateProtectedBranchesLoading:
      updateProtectedBranchesState?.loading ?? false,
    updateProtectedBranchesError: updateProtectedBranchesState?.error ?? null,
    updateProtectedBranches,
  };
}

export default useProtectedBranches;
