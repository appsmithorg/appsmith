import { useGitContext } from "git/components/GitContextProvider";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectConnectModalOpen,
  selectConnectState,
  selectConnectSuccessModalOpen,
} from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useConnect() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const connectState = useArtifactSelector(selectConnectState);

  const connect = useCallback(
    (params: ConnectRequestParams) => {
      if (artifactDef) {
        dispatch(gitArtifactActions.connectInit({ artifactDef, ...params }));
      }
    },
    [artifactDef, dispatch],
  );

  const isConnectModalOpen = useArtifactSelector(selectConnectModalOpen);

  const toggleConnectModal = useCallback(
    (open: boolean) => {
      if (artifactDef) {
        dispatch(gitArtifactActions.toggleConnectModal({ artifactDef, open }));
      }
    },
    [artifactDef, dispatch],
  );

  const isConnectSuccessModalOpen = useArtifactSelector(
    selectConnectSuccessModalOpen,
  );

  const toggleConnectSuccessModal = useCallback(
    (open: boolean) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.toggleConnectSuccessModal({
            artifactDef,
            open,
          }),
        );
      }
    },
    [artifactDef, dispatch],
  );

  return {
    isConnectLoading: connectState?.loading ?? false,
    connectError: connectState?.error ?? null,
    connect,
    isConnectModalOpen: isConnectModalOpen ?? false,
    toggleConnectModal,
    isConnectSuccessModalOpen: isConnectSuccessModalOpen ?? false,
    toggleConnectSuccessModal,
  };
}
