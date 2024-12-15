import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectBranches,
  selectCheckoutBranch,
  selectCreateBranch,
  selectCurrentBranch,
  selectDeleteBranch,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useBranches() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  // fetch branches
  const branchesState = useSelector((state: GitRootState) =>
    selectBranches(state, artifactDef),
  );
  const fetchBranches = useCallback(() => {
    dispatch(
      gitArtifactActions.fetchBranchesInit({
        ...artifactDef,
        pruneBranches: true,
      }),
    );
  }, [artifactDef, dispatch]);

  // create branch
  const createBranchState = useSelector((state: GitRootState) =>
    selectCreateBranch(state, artifactDef),
  );
  const createBranch = useCallback(
    (branchName: string) => {
      dispatch(
        gitArtifactActions.createBranchInit({
          ...artifactDef,
          branchName,
        }),
      );
    },
    [artifactDef, dispatch],
  );
  // delete branch
  const deleteBranchState = useSelector((state: GitRootState) =>
    selectDeleteBranch(state, artifactDef),
  );
  const deleteBranch = useCallback(
    (branchName: string) => {
      dispatch(
        gitArtifactActions.deleteBranchInit({
          ...artifactDef,
          branchName,
        }),
      );
    },
    [artifactDef, dispatch],
  );
  // checkout branch
  const checkoutBranchState = useSelector((state: GitRootState) =>
    selectCheckoutBranch(state, artifactDef),
  );
  const checkoutBranch = useCallback(
    (branchName: string) => {
      dispatch(
        gitArtifactActions.checkoutBranchInit({
          ...artifactDef,
          branchName,
        }),
      );
    },
    [artifactDef, dispatch],
  );

  // derived
  const currentBranch = useSelector((state: GitRootState) =>
    selectCurrentBranch(state, artifactDef),
  );

  // git branch list popup
  const toggleBranchListPopup = (open: boolean) => {
    dispatch(
      gitArtifactActions.toggleBranchListPopup({
        ...artifactDef,
        open,
      }),
    );
  };

  return {
    branches: branchesState?.value,
    fetchBranchesLoading: branchesState?.loading ?? false,
    fetchBranchesError: branchesState?.error,
    fetchBranches,
    createBranchLoading: createBranchState?.loading ?? false,
    createBranchError: createBranchState?.error,
    createBranch,
    deleteBranchLoading: deleteBranchState?.loading ?? false,
    deleteBranchError: deleteBranchState?.error,
    deleteBranch,
    checkoutBranchLoading: checkoutBranchState?.loading ?? false,
    checkoutBranchError: checkoutBranchState?.error,
    checkoutBranch,
    currentBranch: currentBranch ?? null,
    toggleBranchListPopup,
  };
}
