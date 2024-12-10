import { GitOpsTab, type GitArtifactType } from "git/constants/enums";
import type { FetchMergeStatusResponseData } from "git/requests/fetchMergeStatusRequest.types";
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectCommit,
  selectDiscard,
  selectMerge,
  selectMergeStatus,
  selectPull,
  selectStatus,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

interface UseGitOpsParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface UseGitOpsReturnValue {
  commitLoading: boolean;
  commitError: string | null;
  commit: (commitMessage: string) => void;
  discardLoading: boolean;
  discardError: string | null;
  discard: () => void;
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
  fetchMergeStatus: () => void;
  pullLoading: boolean;
  pullError: string | null;
  pull: () => void;
  toggleGitOpsModal: (open: boolean, tab?: keyof typeof GitOpsTab) => void;
}

export default function useGitOps({
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

  // discard
  const discardState = useSelector((state: GitRootState) =>
    selectDiscard(state, basePayload),
  );

  const discard = useCallback(() => {
    dispatch(gitArtifactActions.discardInit(basePayload));
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

  const fetchMergeStatus = useCallback(() => {
    dispatch(gitArtifactActions.fetchMergeStatusInit(basePayload));
  }, [basePayload, dispatch]);

  // pull
  const pullState = useSelector((state: GitRootState) =>
    selectPull(state, basePayload),
  );

  const pull = useCallback(() => {
    dispatch(gitArtifactActions.pullInit(basePayload));
  }, [basePayload, dispatch]);

  // git ops modal
  const toggleGitOpsModal = useCallback(
    (open: boolean, tab: keyof typeof GitOpsTab = GitOpsTab.Deploy) => {
      dispatch(
        gitArtifactActions.toggleGitOpsModal({ ...basePayload, open, tab }),
      );
    },
    [basePayload, dispatch],
  );

  return {
    commitLoading: commitState?.loading ?? false,
    commitError: commitState?.error,
    commit,
    discardLoading: discardState?.loading ?? false,
    discardError: discardState?.error,
    discard,
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
    pullLoading: pullState?.loading ?? false,
    pullError: pullState?.error,
    pull,
    toggleGitOpsModal,
  };
}
