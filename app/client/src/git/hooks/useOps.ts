import { useGitContext } from "git/components/GitContextProvider";
import { GitOpsTab } from "git/constants/enums";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectConflictErrorModalOpen,
  selectOpsModalOpen,
  selectOpsModalTab,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useOps() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  // ops modal
  const opsModalOpen = useSelector((state: GitRootState) =>
    selectOpsModalOpen(state, artifactDef),
  );

  const opsModalTab = useSelector((state: GitRootState) =>
    selectOpsModalTab(state, artifactDef),
  );

  const toggleOpsModal = useCallback(
    (open: boolean, tab: keyof typeof GitOpsTab = GitOpsTab.Deploy) => {
      dispatch(
        gitArtifactActions.toggleOpsModal({ ...artifactDef, open, tab }),
      );
    },
    [artifactDef, dispatch],
  );

  // conflict error modal
  const conflictErrorModalOpen = useSelector((state: GitRootState) =>
    selectConflictErrorModalOpen(state, artifactDef),
  );

  const toggleConflictErrorModal = useCallback(
    (open: boolean) => {
      dispatch(
        gitArtifactActions.toggleConflictErrorModal({ ...artifactDef, open }),
      );
    },
    [artifactDef, dispatch],
  );

  return {
    opsModalTab,
    opsModalOpen,
    toggleOpsModal,
    conflictErrorModalOpen,
    toggleConflictErrorModal,
  };
}
