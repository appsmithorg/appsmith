import { useGitContext } from "git/components/GitContextProvider";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectConnectModalOpen,
  selectConnectState,
  selectFetchSSHKeysState,
  selectGenerateSSHKeyState,
  selectGitImportState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useAritfactSelector from "./useArtifactSelector";

export default function useConnect() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const connectState = useAritfactSelector(selectConnectState);

  const connect = useCallback(
    (params: ConnectRequestParams) => {
      if (artifactDef) {
        dispatch(gitArtifactActions.connectInit({ artifactDef, ...params }));
      }
    },
    [artifactDef, dispatch],
  );

  const gitImportState = useAritfactSelector(selectGitImportState);

  const gitImport = useCallback(
    (params) => {
      dispatch(gitArtifactActions.gitImportInit({ ...artifactDef, ...params }));
    },
    [artifactDef, dispatch],
  );

  const fetchSSHKeyState = useAritfactSelector(selectFetchSSHKeysState);

  const fetchSSHKey = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.fetchSSHKeyInit({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  const resetFetchSSHKey = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.resetFetchSSHKey({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  const generateSSHKeyState = useAritfactSelector(selectGenerateSSHKeyState);

  const generateSSHKey = useCallback(
    (keyType: string, isImport: boolean = false) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.generateSSHKeyInit({
            artifactDef,
            keyType,
            isImport,
          }),
        );
      }
    },
    [artifactDef, dispatch],
  );

  const resetGenerateSSHKey = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.resetGenerateSSHKey({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  const isConnectModalOpen = useAritfactSelector(selectConnectModalOpen);

  const toggleConnectModal = useCallback(
    (open: boolean) => {
      if (artifactDef) {
        dispatch(gitArtifactActions.toggleConnectModal({ artifactDef, open }));
      }
    },
    [artifactDef, dispatch],
  );

  return {
    isConnectLoading: connectState?.loading ?? false,
    connectError: connectState?.error ?? null,
    connect,
    isGitImportLoading: gitImportState?.loading ?? false,
    gitImportError: gitImportState?.error ?? null,
    gitImport,
    sshKey: fetchSSHKeyState?.value ?? null,
    isFetchSSHKeyLoading: fetchSSHKeyState?.loading ?? false,
    fetchSSHKeyError: fetchSSHKeyState?.error ?? null,
    fetchSSHKey,
    resetFetchSSHKey,
    isGenerateSSHKeyLoading: generateSSHKeyState?.loading ?? false,
    generateSSHKeyError: generateSSHKeyState?.error ?? null,
    generateSSHKey,
    resetGenerateSSHKey,
    isConnectModalOpen: isConnectModalOpen ?? false,
    toggleConnectModal,
  };
}
