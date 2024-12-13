import type { GitArtifactType, GitSettingsTab } from "git/constants/enums";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectAutocommitEnabled,
  selectAutocommitPolling,
  selectProtectedBranches,
  selectProtectedMode,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

interface UseGitSettingsParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface UseGitSettingsReturnValue {
  autocommitEnabled: boolean;
  autocommitPolling: boolean;
  protectedBranches: FetchProtectedBranchesResponseData | null;
  fetchProtectedBranchesLoading: boolean;
  fetchProtectedBranchesError: string | null;
  fetchProtectedBranches: () => void;
  protectedMode: boolean;
  toggleGitSettingsModal: (
    open: boolean,
    tab: keyof typeof GitSettingsTab,
  ) => void;
}

export default function useGitSettings({
  artifactType,
  baseArtifactId,
}: UseGitSettingsParams): UseGitSettingsReturnValue {
  const dispatch = useDispatch();
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );

  // autocommit
  const autocommitEnabled = useSelector((state: GitRootState) =>
    selectAutocommitEnabled(state, basePayload),
  );

  const autocommitPolling = useSelector((state: GitRootState) =>
    selectAutocommitPolling(state, basePayload),
  );

  // branch protection
  const protectedBranchesState = useSelector((state: GitRootState) =>
    selectProtectedBranches(state, basePayload),
  );

  const fetchProtectedBranches = () => {
    dispatch(
      gitArtifactActions.fetchProtectedBranchesInit({
        ...basePayload,
      }),
    );
  };

  const protectedMode = useSelector((state: GitRootState) =>
    selectProtectedMode(state, basePayload),
  );

  // ui
  const toggleGitSettingsModal = (
    open: boolean,
    tab: keyof typeof GitSettingsTab,
  ) => {
    dispatch(
      gitArtifactActions.toggleGitSettingsModal({
        ...basePayload,
        open,
        tab,
      }),
    );
  };

  return {
    autocommitEnabled: autocommitEnabled ?? false,
    autocommitPolling: autocommitPolling ?? false,
    protectedBranches: protectedBranchesState.value,
    fetchProtectedBranchesLoading: protectedBranchesState.loading ?? false,
    fetchProtectedBranchesError: protectedBranchesState.error,
    fetchProtectedBranches,
    protectedMode: protectedMode ?? false,
    toggleGitSettingsModal,
  };
}
