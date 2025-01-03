import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectFetchSSHKeysState,
  selectGenerateSSHKeyState,
} from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useSSHKey() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const fetchSSHKeyState = useArtifactSelector(selectFetchSSHKeysState);

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

  const generateSSHKeyState = useArtifactSelector(selectGenerateSSHKeyState);

  const generateSSHKey = useCallback(
    (keyType: string) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.generateSSHKeyInit({
            artifactDef,
            keyType,
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

  return {
    sshKey: fetchSSHKeyState?.value ?? null,
    isFetchSSHKeyLoading: fetchSSHKeyState?.loading ?? false,
    fetchSSHKeyError: fetchSSHKeyState?.error ?? null,
    fetchSSHKey,
    resetFetchSSHKey,
    isGenerateSSHKeyLoading: generateSSHKeyState?.loading ?? false,
    generateSSHKeyError: generateSSHKeyState?.error ?? null,
    generateSSHKey,
    resetGenerateSSHKey,
  };
}
