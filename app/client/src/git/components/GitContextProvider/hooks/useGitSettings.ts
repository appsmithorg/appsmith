import type { GitArtifactType, GitSettingsTab } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { useMemo } from "react";
import { useDispatch } from "react-redux";

interface UseGitSettingsParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface UseGitSettingsReturnValue {
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
    toggleGitSettingsModal,
  };
}
