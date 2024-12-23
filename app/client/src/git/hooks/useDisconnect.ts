import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectDisconnectArtifactName,
  selectDisconnectBaseArtifactId,
  selectDisconnectState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useDisconnect() {
  const { artifact, artifactDef } = useGitContext();
  const artifactName = artifact?.name ?? "";

  const dispatch = useDispatch();

  const disconnectState = useArtifactSelector(selectDisconnectState);

  const disconnect = useCallback(() => {
    if (artifactDef) {
      dispatch(
        gitArtifactActions.disconnectInit({
          artifactDef,
        }),
      );
    }
  }, [artifactDef, dispatch]);

  const disconnectBaseArtifactId = useArtifactSelector(
    selectDisconnectBaseArtifactId,
  );

  const disconnectArtifactName = useArtifactSelector(
    selectDisconnectArtifactName,
  );

  const openDisconnectModal = useCallback(() => {
    if (artifactDef) {
      dispatch(
        gitArtifactActions.openDisconnectModal({ artifactDef, artifactName }),
      );
    }
  }, [artifactDef, artifactName, dispatch]);

  const closeDisconnectModal = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.closeDisconnectModal({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  return {
    isDisconnectLoading: disconnectState?.loading ?? false,
    disconnectError: disconnectState?.error ?? null,
    disconnect,
    isDisconnectModalOpen: !!disconnectBaseArtifactId,
    disconnectBaseArtifactId,
    disconnectArtifactName,
    openDisconnectModal,
    closeDisconnectModal,
  };
}
