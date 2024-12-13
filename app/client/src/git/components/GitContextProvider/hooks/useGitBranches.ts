import type { GitArtifactType } from "git/constants/enums";
import type { FetchBranchesResponseData } from "git/requests/fetchBranchesRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectBranches,
  selectCheckoutBranch,
  selectCreateBranch,
  selectCurrentBranch,
  selectDeleteBranch,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitApiError, GitRootState } from "git/store/types";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

interface UseGitBranchesParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface UseGitBranchesReturnValue {
  branches: FetchBranchesResponseData | null;
  fetchBranchesLoading: boolean;
  fetchBranchesError: GitApiError | null;
  fetchBranches: () => void;
  createBranchLoading: boolean;
  createBranchError: GitApiError | null;
  createBranch: (branchName: string) => void;
  deleteBranchLoading: boolean;
  deleteBranchError: GitApiError | null;
  deleteBranch: (branchName: string) => void;
  checkoutBranchLoading: boolean;
  checkoutBranchError: GitApiError | null;
  checkoutBranch: (branchName: string) => void;
  currentBranch: string | null;
  toggleBranchListPopup: (open: boolean) => void;
}

export default function useGitBranches({
  artifactType,
  baseArtifactId,
}: UseGitBranchesParams): UseGitBranchesReturnValue {
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );
  const dispatch = useDispatch();

  // fetch branches
  const branchesState = useSelector((state: GitRootState) =>
    selectBranches(state, basePayload),
  );
  const fetchBranches = useCallback(() => {
    dispatch(
      gitArtifactActions.fetchBranchesInit({
        ...basePayload,
        pruneBranches: true,
      }),
    );
  }, [basePayload, dispatch]);

  // create branch
  const createBranchState = useSelector((state: GitRootState) =>
    selectCreateBranch(state, basePayload),
  );
  const createBranch = useCallback(
    (branchName: string) => {
      dispatch(
        gitArtifactActions.createBranchInit({
          ...basePayload,
          branchName,
        }),
      );
    },
    [basePayload, dispatch],
  );
  // delete branch
  const deleteBranchState = useSelector((state: GitRootState) =>
    selectDeleteBranch(state, basePayload),
  );
  const deleteBranch = useCallback(
    (branchName: string) => {
      dispatch(
        gitArtifactActions.deleteBranchInit({
          ...basePayload,
          branchName,
        }),
      );
    },
    [basePayload, dispatch],
  );
  // checkout branch
  const checkoutBranchState = useSelector((state: GitRootState) =>
    selectCheckoutBranch(state, basePayload),
  );
  const checkoutBranch = useCallback(
    (branchName: string) => {
      dispatch(
        gitArtifactActions.checkoutBranchInit({
          ...basePayload,
          branchName,
        }),
      );
    },
    [basePayload, dispatch],
  );

  // derived
  const currentBranch = useSelector((state: GitRootState) =>
    selectCurrentBranch(state, basePayload),
  );

  // git branch list popup
  const toggleBranchListPopup = (open: boolean) => {
    dispatch(
      gitArtifactActions.toggleBranchListPopup({
        ...basePayload,
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
