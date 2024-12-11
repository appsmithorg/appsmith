import type { GitArtifactType } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { useMemo } from "react";
import { useDispatch } from "react-redux";

interface UseGitConnectParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  connectPermitted: boolean;
}

export interface UseGitConnectReturnValue {
  toggleConnectModal: (open: boolean) => void;
  connectPermitted: boolean;
}

export default function useGitConnect({
  artifactType,
  baseArtifactId,
  connectPermitted,
}: UseGitConnectParams): UseGitConnectReturnValue {
  const dispatch = useDispatch();
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );

  const toggleConnectModal = (open: boolean) => {
    dispatch(
      gitArtifactActions.toggleConnectModal({
        ...basePayload,
        open,
      }),
    );
  };

  return {
    toggleConnectModal,
    connectPermitted,
  };
}
