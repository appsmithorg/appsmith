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
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";

export default function useConnect() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const connectState = useSelector((state: GitRootState) =>
    selectConnectState(state, artifactDef),
  );

  const connect = useCallback(
    (params: ConnectRequestParams) => {
      dispatch(gitArtifactActions.connectInit({ ...artifactDef, ...params }));
    },
    [artifactDef, dispatch],
  );

  const gitImportState = useSelector((state: GitRootState) =>
    selectGitImportState(state, artifactDef),
  );

  const gitImport = useCallback(
    (params) => {
      dispatch(gitArtifactActions.gitImportInit({ ...artifactDef, ...params }));
    },
    [artifactDef, dispatch],
  );

  const fetchSSHKeyState = useSelector((state: GitRootState) =>
    selectFetchSSHKeysState(state, artifactDef),
  );

  const fetchSSHKey = useCallback(() => {
    dispatch(gitArtifactActions.fetchSSHKeyInit(artifactDef));
  }, [artifactDef, dispatch]);

  const resetFetchSSHKey = useCallback(() => {
    dispatch(gitArtifactActions.resetFetchSSHKey(artifactDef));
  }, [artifactDef, dispatch]);

  const generateSSHKeyState = useSelector((state: GitRootState) =>
    selectGenerateSSHKeyState(state, artifactDef),
  );

  const generateSSHKey = useCallback(
    (keyType: string, isImport: boolean = false) => {
      dispatch(
        gitArtifactActions.generateSSHKeyInit({
          ...artifactDef,
          keyType,
          isImport,
        }),
      );
    },
    [artifactDef, dispatch],
  );

  const resetGenerateSSHKey = useCallback(() => {
    dispatch(gitArtifactActions.resetGenerateSSHKey(artifactDef));
  }, [artifactDef, dispatch]);

  const isConnectModalOpen = useSelector((state: GitRootState) =>
    selectConnectModalOpen(state, artifactDef),
  );

  const toggleConnectModal = useCallback(
    (open: boolean) => {
      dispatch(gitArtifactActions.toggleConnectModal({ ...artifactDef, open }));
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
    isConnectModalOpen,
    toggleConnectModal,
  };
}
