import { useGitContext } from "git/components/GitContextProvider";
import { GitOpsTab } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectConflictErrorModalOpen,
  selectOpsModalOpen,
  selectOpsModalTab,
} from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useOps() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  // ops modal
  const opsModalOpen = useArtifactSelector(selectOpsModalOpen);

  const opsModalTab = useArtifactSelector(selectOpsModalTab);

  const toggleOpsModal = useCallback(
    (open: boolean, tab: keyof typeof GitOpsTab = GitOpsTab.Deploy) => {
      if (artifactDef) {
        dispatch(gitArtifactActions.toggleOpsModal({ artifactDef, open, tab }));
      }
    },
    [artifactDef, dispatch],
  );

  // conflict error modal
  const conflictErrorModalOpen = useArtifactSelector(
    selectConflictErrorModalOpen,
  );

  const toggleConflictErrorModal = useCallback(
    (open: boolean) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.toggleConflictErrorModal({ artifactDef, open }),
        );
      }
    },
    [artifactDef, dispatch],
  );

  return {
    opsModalTab,
    isOpsModalOpen: opsModalOpen ?? false,
    toggleOpsModal,
    isConflictErrorModalOpen: conflictErrorModalOpen ?? false,
    toggleConflictErrorModal,
  };
}
