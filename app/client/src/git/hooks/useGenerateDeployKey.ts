import { useGitContext } from "git/components/GitContextProvider";
import { selectGenerateSSHKeyModalOpen } from "git/store/selectors/gitGlobalSelectors";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { selectUpdateGeneratedSSHKeyState } from "git/store/selectors/gitGlobalSelectors";

function useGenerateDeployKey() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const isGenerateSSHKeyModalOpen = useArtifactSelector(
    selectGenerateSSHKeyModalOpen,
  );
  const updateGeneratedSSHKeyState = useSelector(
    selectUpdateGeneratedSSHKeyState,
  );

  const toggleGenerateSSHKeyModal = useCallback(
    (open: boolean) => {
      if (artifactDef) {
        dispatch(gitGlobalActions.toggleGenerateSSHKeyModal({ open }));
      }
    },
    [artifactDef, dispatch],
  );

  const updateGeneratedSSHKey = useCallback(() => {
    if (artifactDef) {
      dispatch(gitGlobalActions.updateGeneratedSSHKeyInit({ artifactDef }));
    }
  }, [dispatch]);

  const resetUpdateGeneratedSSHKey = useCallback(() => {
    dispatch(gitGlobalActions.resetUpdateGeneratedSSHKey());
  }, [dispatch]);

  return {
    isGenerateSSHKeyModalOpen: isGenerateSSHKeyModalOpen ?? false,
    toggleGenerateSSHKeyModal,
    updateGeneratedSSHKey,
    isUpdateGeneratedSSHKeyLoading:
      updateGeneratedSSHKeyState?.loading ?? false,
    updateGeneratedSSHKeyError: updateGeneratedSSHKeyState?.error ?? null,
    resetUpdateGeneratedSSHKey,
  };
}

export default useGenerateDeployKey;
