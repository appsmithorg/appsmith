import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectDisconnectArtifactName,
  selectDisconnectBaseArtifactId,
  selectDisconnectState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useDisconnect() {
  const { artifact, artifactDef } = useGitContext();
  const artifactName = artifact?.name ?? "";

  const dispatch = useDispatch();

  const disconnectState = useSelector((state: GitRootState) =>
    selectDisconnectState(state, artifactDef),
  );

  const disconnect = useCallback(() => {
    dispatch(gitArtifactActions.disconnectInit(artifactDef));
  }, [artifactDef, dispatch]);

  const diconnectBaseArtifactId = useSelector((state: GitRootState) =>
    selectDisconnectBaseArtifactId(state, artifactDef),
  );

  const disconnectArtifactName = useSelector((state: GitRootState) =>
    selectDisconnectArtifactName(state, artifactDef),
  );

  const openDisconnectModal = useCallback(() => {
    dispatch(
      gitArtifactActions.openDisconnectModal({ ...artifactDef, artifactName }),
    );
  }, [artifactDef, artifactName, dispatch]);

  const closeDisconnectModal = useCallback(() => {
    dispatch(gitArtifactActions.closeDisconnectModal(artifactDef));
  }, [artifactDef, dispatch]);

  return {
    isDisconnectLoading: disconnectState?.loading ?? false,
    disconnectError: disconnectState?.error ?? null,
    disconnect,
    isDisconnectModalOpen: !!diconnectBaseArtifactId,
    diconnectBaseArtifactId,
    disconnectArtifactName,
    openDisconnectModal,
    closeDisconnectModal,
  };
}
