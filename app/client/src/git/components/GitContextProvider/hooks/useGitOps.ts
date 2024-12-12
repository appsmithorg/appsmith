import { GitOpsTab, type GitArtifactType } from "git/constants/enums";
import type { FetchMergeStatusResponseData } from "git/requests/fetchMergeStatusRequest.types";
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectCommit,
  selectConflictErrorModalOpen,
  selectDiscard,
  selectMerge,
  selectMergeStatus,
  selectOpsModalOpen,
  selectOpsModalTab,
  selectPull,
  selectStatus,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

interface UseGitOpsParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  artifactId: string | null;
}

export interface UseGitOpsReturnValue {
  commitLoading: boolean;
  commitError: string | null;
  commit: (commitMessage: string) => void;
  clearCommitError: () => void;
  discardLoading: boolean;
  discardError: string | null;
  discard: () => void;
  clearDiscardError: () => void;
  status: FetchStatusResponseData | null;
  fetchStatusLoading: boolean;
  fetchStatusError: string | null;
  fetchStatus: () => void;
  mergeLoading: boolean;
  mergeError: string | null;
  merge: () => void;
  mergeStatus: FetchMergeStatusResponseData | null;
  fetchMergeStatusLoading: boolean;
  fetchMergeStatusError: string | null;
  fetchMergeStatus: (sourceBranch: string, destinationBranch: string) => void;
  clearMergeStatus: () => void;
  pullLoading: boolean;
  pullError: string | null;
  pull: () => void;
  opsModalTab: keyof typeof GitOpsTab;
  opsModalOpen: boolean;
  toggleOpsModal: (open: boolean, tab?: keyof typeof GitOpsTab) => void;
  conflictErrorModalOpen: boolean;
  toggleConflictErrorModal: (open: boolean) => void;
}

export default function useGitOps({
  artifactId,
  artifactType,
  baseArtifactId,
}: UseGitOpsParams): UseGitOpsReturnValue {
  const dispatch = useDispatch();
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );

  // commit
  const commitState = useSelector((state: GitRootState) =>
    selectCommit(state, basePayload),
  );

  const commit = useCallback(
    (commitMessage: string) => {
      dispatch(
        gitArtifactActions.commitInit({
          ...basePayload,
          commitMessage,
          doPush: true,
        }),
      );
    },
    [basePayload, dispatch],
  );

  const clearCommitError = useCallback(() => {
    dispatch(gitArtifactActions.clearCommitError(basePayload));
  }, [basePayload, dispatch]);

  // discard
  const discardState = useSelector((state: GitRootState) =>
    selectDiscard(state, basePayload),
  );

  const discard = useCallback(() => {
    dispatch(gitArtifactActions.discardInit(basePayload));
  }, [basePayload, dispatch]);

  const clearDiscardError = useCallback(() => {
    dispatch(gitArtifactActions.clearDiscardError(basePayload));
  }, [basePayload, dispatch]);

  // status
  const statusState = useSelector((state: GitRootState) =>
    selectStatus(state, basePayload),
  );

  const fetchStatus = useCallback(() => {
    dispatch(
      gitArtifactActions.fetchStatusInit({
        ...basePayload,
        compareRemote: true,
      }),
    );
  }, [basePayload, dispatch]);

  // merge
  const mergeState = useSelector((state: GitRootState) =>
    selectMerge(state, basePayload),
  );

  const merge = useCallback(() => {
    dispatch(gitArtifactActions.mergeInit(basePayload));
  }, [basePayload, dispatch]);

  // merge status
  const mergeStatusState = useSelector((state: GitRootState) =>
    selectMergeStatus(state, basePayload),
  );

  const fetchMergeStatus = useCallback(
    (sourceBranch: string, destinationBranch: string) => {
      dispatch(
        gitArtifactActions.fetchMergeStatusInit({
          ...basePayload,
          artifactId: artifactId ?? "",
          sourceBranch,
          destinationBranch,
        }),
      );
    },
    [artifactId, basePayload, dispatch],
  );

  const clearMergeStatus = useCallback(() => {
    dispatch(gitArtifactActions.clearMergeStatus(basePayload));
  }, [basePayload, dispatch]);

  // pull
  const pullState = useSelector((state: GitRootState) =>
    selectPull(state, basePayload),
  );

  const pull = useCallback(() => {
    dispatch(
      gitArtifactActions.pullInit({
        ...basePayload,
        artifactId: artifactId ?? "",
      }),
    );
  }, [basePayload, artifactId, dispatch]);

  // ops modal
  const opsModalOpen = useSelector((state: GitRootState) =>
    selectOpsModalOpen(state, basePayload),
  );

  const opsModalTab = useSelector((state: GitRootState) =>
    selectOpsModalTab(state, basePayload),
  );

  const toggleOpsModal = useCallback(
    (open: boolean, tab: keyof typeof GitOpsTab = GitOpsTab.Deploy) => {
      dispatch(
        gitArtifactActions.toggleOpsModal({ ...basePayload, open, tab }),
      );
    },
    [basePayload, dispatch],
  );

  // conflict error modal
  const conflictErrorModalOpen = useSelector((state: GitRootState) =>
    selectConflictErrorModalOpen(state, basePayload),
  );

  const toggleConflictErrorModal = useCallback(
    (open: boolean) => {
      dispatch(
        gitArtifactActions.toggleConflictErrorModal({ ...basePayload, open }),
      );
    },
    [basePayload, dispatch],
  );

  return {
    commitLoading: commitState?.loading ?? false,
    commitError: commitState?.error,
    commit,
    clearCommitError,
    discardLoading: discardState?.loading ?? false,
    discardError: discardState?.error,
    discard,
    clearDiscardError,
    status: statusState?.value,
    fetchStatusLoading: statusState?.loading ?? false,
    fetchStatusError: statusState?.error,
    fetchStatus,
    mergeLoading: mergeState?.loading ?? false,
    mergeError: mergeState?.error,
    merge,
    mergeStatus: mergeStatusState?.value,
    fetchMergeStatusLoading: mergeStatusState?.loading ?? false,
    fetchMergeStatusError: mergeStatusState?.error,
    fetchMergeStatus,
    clearMergeStatus,
    pullLoading: pullState?.loading ?? false,
    pullError: pullState?.error,
    pull,
    opsModalTab,
    opsModalOpen,
    toggleOpsModal,
    conflictErrorModalOpen,
    toggleConflictErrorModal,
  };
}
