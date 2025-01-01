import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectAutocommitDisableModalOpen,
  selectAutocommitEnabled,
  selectAutocommitPolling,
  selectToggleAutocommitState,
  selectTriggerAutocommitState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useAutocommit() {
  const { artifactDef } = useGitContext();
  const dispatch = useDispatch();

  const toggleAutocommitState = useSelector((state: GitRootState) =>
    selectToggleAutocommitState(state, artifactDef),
  );

  const triggerAutocommitState = useSelector((state: GitRootState) =>
    selectTriggerAutocommitState(state, artifactDef),
  );

  const toggleAutocommit = useCallback(() => {
    dispatch(gitArtifactActions.toggleAutocommitInit(artifactDef));
  }, [artifactDef, dispatch]);

  const isAutocommitDisableModalOpen = useSelector((state: GitRootState) =>
    selectAutocommitDisableModalOpen(state, artifactDef),
  );

  const toggleAutocommitDisableModal = useCallback(
    (open: boolean) => {
      dispatch(
        gitArtifactActions.toggleAutocommitDisableModal({
          ...artifactDef,
          open,
        }),
      );
    },
    [artifactDef, dispatch],
  );

  const isAutocommitEnabled = useSelector((state: GitRootState) =>
    selectAutocommitEnabled(state, artifactDef),
  );

  const isAutocommitPolling = useSelector((state: GitRootState) =>
    selectAutocommitPolling(state, artifactDef),
  );

  return {
    isToggleAutocommitLoading: toggleAutocommitState?.loading ?? false,
    toggleAutocommitError: toggleAutocommitState?.error ?? null,
    toggleAutocommit,
    isTriggerAutocommitLoading: triggerAutocommitState?.loading ?? false,
    triggerAutocommitError: triggerAutocommitState?.error ?? null,
    isAutocommitDisableModalOpen,
    toggleAutocommitDisableModal,
    isAutocommitEnabled,
    isAutocommitPolling,
  };
}
