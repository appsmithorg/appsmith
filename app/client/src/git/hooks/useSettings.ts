import { useGitContext } from "git/components/GitContextProvider";
import { GitSettingsTab } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectSettingsModalOpen,
  selectSettingsModalTab,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useSettings() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const settingsModalOpen = useSelector((state: GitRootState) =>
    selectSettingsModalOpen(state, artifactDef),
  );

  const settingsModalTab = useSelector((state: GitRootState) =>
    selectSettingsModalTab(state, artifactDef),
  );

  const toggleSettingsModal = useCallback(
    (
      open: boolean,
      tab: keyof typeof GitSettingsTab = GitSettingsTab.General,
    ) => {
      dispatch(
        gitArtifactActions.toggleSettingsModal({ ...artifactDef, open, tab }),
      );
    },
    [artifactDef, dispatch],
  );

  return {
    isSettingsModalOpen: settingsModalOpen ?? false,
    settingsModalTab: settingsModalTab ?? GitSettingsTab.General,
    toggleSettingsModal,
  };
}
