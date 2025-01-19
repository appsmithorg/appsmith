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
} from "git/store/selectors/gitArtifactSelectors";
import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";
import refToBranchList from "git/helpers/refToBranchList";
import useGitFeatureFlags from "./useGitFeatureFlags";
import type { GitBranch } from "git/types";

export default function useBranches() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;

  const dispatch = useDispatch();

  // fetch branches
  const branchesState = useArtifactSelector(selectFetchBranchesState);
  const { release_git_api_contracts_enabled: isGitApiContractsEnabled } =
    useGitFeatureFlags();

  const branches = useMemo(() => {
    if (!Array.isArray(branchesState?.value)) {
      return null;
    }

    if (!isGitApiContractsEnabled) {
      return branchesState.value;
    }

    return refToBranchList(branchesState.value);
  }, [branchesState?.value, isGitApiContractsEnabled]);

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
  const createBranchState = useArtifactSelector(selectCreateBranchState);
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
  const deleteBranchState = useArtifactSelector(selectDeleteBranchState);
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
  const checkoutBranchState = useArtifactSelector(selectCheckoutBranchState);
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

  const checkoutDestBranch = useArtifactSelector(selectCheckoutDestBranch);

  // derived
  const currentBranch = useArtifactSelector(selectCurrentBranch);

  // git branch list popup
  const isBranchPopupOpen = useArtifactSelector(selectBranchPopupOpen);

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
    branches: branches as GitBranch[] | null,
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
