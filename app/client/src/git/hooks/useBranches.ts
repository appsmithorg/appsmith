import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectFetchBranchesState,
  selectBranchPopupOpen,
  selectCheckoutBranchState,
  selectCheckoutDestBranch,
  selectCreateBranchState,
  selectDeleteBranchState,
  selectCurrentBranch,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useBranches() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  // fetch branches
  const branchesState = useSelector((state: GitRootState) =>
    selectFetchBranchesState(state, artifactDef),
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
    selectCreateBranchState(state, artifactDef),
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
    selectDeleteBranchState(state, artifactDef),
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
    selectCheckoutBranchState(state, artifactDef),
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

  const checkoutDestBranch = useSelector((state: GitRootState) =>
    selectCheckoutDestBranch(state, artifactDef),
  );

  // derived
  const currentBranch = useSelector((state: GitRootState) =>
    selectCurrentBranch(state, artifactDef),
  );

  // git branch list popup
  const isBranchPopupOpen = useSelector((state: GitRootState) =>
    selectBranchPopupOpen(state, artifactDef),
  );

  const toggleBranchPopup = useCallback(
    (open: boolean) => {
      dispatch(
        gitArtifactActions.toggleBranchPopup({
          ...artifactDef,
          open,
        }),
      );
    },
    [artifactDef, dispatch],
  );

  return {
    branches: branchesState?.value,
    isFetchBranchesLoading: branchesState?.loading ?? false,
    fetchBranchesError: branchesState?.error ?? null,
    fetchBranches,
    isCreateBranchLoading: createBranchState?.loading ?? false,
    createBranchError: createBranchState?.error ?? null,
    createBranch,
    isDeleteBranchLoading: deleteBranchState?.loading ?? false,
    deleteBranchError: deleteBranchState?.error ?? null,
    deleteBranch,
    isCheckoutBranchLoading: checkoutBranchState?.loading ?? false,
    checkoutBranchError: checkoutBranchState?.error ?? null,
    checkoutBranch,
    checkoutDestBranch,
    currentBranch: currentBranch ?? null,
    isBranchPopupOpen,
    toggleBranchPopup,
  };
}
