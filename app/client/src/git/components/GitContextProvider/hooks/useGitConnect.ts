import type { GitArtifactType } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { useMemo } from "react";
import { useDispatch } from "react-redux";

interface UseGitConnectParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface UseGitConnectReturnValue {
  toggleGitConnectModal: (open: boolean) => void;
}

export default function useGitConnect({
  artifactType,
  baseArtifactId,
}: UseGitConnectParams): UseGitConnectReturnValue {
  const dispatch = useDispatch();
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );

  const toggleGitConnectModal = (open: boolean) => {
    dispatch(
      gitArtifactActions.toggleGitConnectModal({
        ...basePayload,
        open,
      }),
    );
  };

  return {
    toggleGitConnectModal,
  };
}
