import { GitSettingsTab, type GitArtifactType } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectAutocommitEnabled,
  selectAutocommitPolling,
  selectSettingsModalOpen,
  selectSettingsModalTab,
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
  settingsModalOpen: boolean;
  settingsModalTab: keyof typeof GitSettingsTab;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
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

  // ui
  const settingsModalOpen = useSelector((state: GitRootState) =>
    selectSettingsModalOpen(state, basePayload),
  );

  const settingsModalTab = useSelector((state: GitRootState) =>
    selectSettingsModalTab(state, basePayload),
  );

  const toggleSettingsModal = (
    open: boolean,
    tab: keyof typeof GitSettingsTab = GitSettingsTab.General,
  ) => {
    dispatch(
      gitArtifactActions.toggleSettingsModal({
        ...basePayload,
        open,
        tab,
      }),
    );
  };

  return {
    autocommitEnabled: autocommitEnabled ?? false,
    autocommitPolling: autocommitPolling ?? false,

    settingsModalOpen: settingsModalOpen ?? false,
    settingsModalTab: settingsModalTab ?? GitSettingsTab.General,
    toggleSettingsModal,
  };
}
