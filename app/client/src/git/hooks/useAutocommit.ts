import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectAutocommitDisableModalOpen,
  selectAutocommitEnabled,
  selectAutocommitPolling,
  selectToggleAutocommitState,
  selectTriggerAutocommitState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useAritfactSelector from "./useArtifactSelector";

export default function useAutocommit() {
  const { artifactDef } = useGitContext();
  const dispatch = useDispatch();

  const toggleAutocommitState = useAritfactSelector(
    selectToggleAutocommitState,
  );

  const triggerAutocommitState = useAritfactSelector(
    selectTriggerAutocommitState,
  );

  const toggleAutocommit = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.toggleAutocommitInit({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  const isAutocommitDisableModalOpen = useAritfactSelector(
    selectAutocommitDisableModalOpen,
  );

  const toggleAutocommitDisableModal = useCallback(
    (open: boolean) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.toggleAutocommitDisableModal({
            artifactDef,
            open,
          }),
        );
      }
    },
    [artifactDef, dispatch],
  );

  const isAutocommitEnabled = useAritfactSelector(selectAutocommitEnabled);

  const isAutocommitPolling = useAritfactSelector(selectAutocommitPolling);

  return {
    isToggleAutocommitLoading: toggleAutocommitState?.loading ?? false,
    toggleAutocommitError: toggleAutocommitState?.error ?? null,
    toggleAutocommit,
    isTriggerAutocommitLoading: triggerAutocommitState?.loading ?? false,
    triggerAutocommitError: triggerAutocommitState?.error ?? null,
    isAutocommitDisableModalOpen: isAutocommitDisableModalOpen ?? false,
    toggleAutocommitDisableModal,
    isAutocommitEnabled: isAutocommitEnabled ?? false,
    isAutocommitPolling: isAutocommitPolling ?? false,
  };
}
