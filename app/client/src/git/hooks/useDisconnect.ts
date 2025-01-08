import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectDisconnectArtifactDef,
  selectDisconnectArtifactName,
  selectDisconnectState,
} from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";
import type { GitArtifactDef } from "git/store/types";

export default function useDisconnect() {
  const { artifactDef } = useGitContext();

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

  const disconnectArtifactDef = useArtifactSelector(
    selectDisconnectArtifactDef,
  );

  const disconnectArtifactName = useArtifactSelector(
    selectDisconnectArtifactName,
  );

  const openDisconnectModal = useCallback(
    (targetArtifactDef: GitArtifactDef, targetArtifactName: string) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.openDisconnectModal({
            artifactDef,
            targetArtifactDef,
            targetArtifactName,
          }),
        );
      }
    },
    [artifactDef, dispatch],
  );

  const closeDisconnectModal = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.closeDisconnectModal({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  return {
    isDisconnectLoading: disconnectState?.loading ?? false,
    disconnectError: disconnectState?.error ?? null,
    disconnect,
    isDisconnectModalOpen: !!disconnectArtifactDef,
    disconnectArtifactDef,
    disconnectArtifactName,
    openDisconnectModal,
    closeDisconnectModal,
  };
}
