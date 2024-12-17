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
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useAritfactSelector from "./useArtifactSelector";

export default function useBranches() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;

  const dispatch = useDispatch();

  // fetch branches
  const branchesState = useAritfactSelector(selectFetchBranchesState);

  const fetchBranches = useCallback(() => {
    if (artifactDef && artifactId) {
      dispatch(
        gitArtifactActions.fetchBranchesInit({
          artifactId,
          artifactDef,
          pruneBranches: true,
        }),
      );
    }
  }, [artifactDef, artifactId, dispatch]);

  // create branch
  const createBranchState = useAritfactSelector(selectCreateBranchState);
  const createBranch = useCallback(
    (branchName: string) => {
      if (artifactDef && artifactId) {
        dispatch(
          gitArtifactActions.createBranchInit({
            artifactDef,
            artifactId,
            branchName,
          }),
        );
      }
    },
    [artifactDef, artifactId, dispatch],
  );
  // delete branch
  const deleteBranchState = useAritfactSelector(selectDeleteBranchState);
  const deleteBranch = useCallback(
    (branchName: string) => {
      if (artifactDef && artifactId) {
        dispatch(
          gitArtifactActions.deleteBranchInit({
            artifactId,
            artifactDef,
            branchName,
          }),
        );
      }
    },
    [artifactDef, artifactId, dispatch],
  );
  // checkout branch
  const checkoutBranchState = useAritfactSelector(selectCheckoutBranchState);
  const checkoutBranch = useCallback(
    (branchName: string) => {
      if (artifactDef && artifactId) {
        dispatch(
          gitArtifactActions.checkoutBranchInit({
            artifactDef,
            artifactId,
            branchName,
          }),
        );
      }
    },
    [artifactDef, artifactId, dispatch],
  );

  const checkoutDestBranch = useAritfactSelector(selectCheckoutDestBranch);

  // derived
  const currentBranch = useAritfactSelector(selectCurrentBranch);

  // git branch list popup
  const isBranchPopupOpen = useAritfactSelector(selectBranchPopupOpen);

  const toggleBranchPopup = useCallback(
    (open: boolean) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.toggleBranchPopup({
            artifactDef,
            open,
          }),
        );
      }
    },
    [artifactDef, dispatch],
  );

  return {
    branches: branchesState?.value ?? null,
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
    isBranchPopupOpen: isBranchPopupOpen ?? false,
    toggleBranchPopup,
  };
}
