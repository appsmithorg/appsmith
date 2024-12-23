import { useGitContext } from "git/components/GitContextProvider";
import { GitSettingsTab } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectSettingsModalOpen,
  selectSettingsModalTab,
} from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useSettings() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const settingsModalOpen = useArtifactSelector(selectSettingsModalOpen);

  const settingsModalTab = useArtifactSelector(selectSettingsModalTab);

  const toggleSettingsModal = useCallback(
    (
      open: boolean,
      tab: keyof typeof GitSettingsTab = GitSettingsTab.General,
    ) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.toggleSettingsModal({ artifactDef, open, tab }),
        );
      }
    },
    [artifactDef, dispatch],
  );

  return {
    isSettingsModalOpen: settingsModalOpen ?? false,
    settingsModalTab: settingsModalTab,
    toggleSettingsModal,
  };
}
