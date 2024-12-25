import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectMergeState,
  selectMergeStatusState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useMerge() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;
  const dispatch = useDispatch();

  // merge
  const mergeState = useSelector((state: GitRootState) =>
    selectMergeState(state, artifactDef),
  );

  const merge = useCallback(() => {
    dispatch(gitArtifactActions.mergeInit(artifactDef));
  }, [artifactDef, dispatch]);

  // merge status
  const mergeStatusState = useSelector((state: GitRootState) =>
    selectMergeStatusState(state, artifactDef),
  );

  const fetchMergeStatus = useCallback(
    (sourceBranch: string, destinationBranch: string) => {
      dispatch(
        gitArtifactActions.fetchMergeStatusInit({
          ...artifactDef,
          artifactId: artifactId ?? "",
          sourceBranch,
          destinationBranch,
        }),
      );
    },
    [artifactId, artifactDef, dispatch],
  );

  const clearMergeStatus = useCallback(() => {
    dispatch(gitArtifactActions.clearMergeStatus(artifactDef));
  }, [artifactDef, dispatch]);

  return {
    isMergeLoading: mergeState?.loading ?? false,
    mergeError: mergeState?.error,
    merge,
    mergeStatus: mergeStatusState?.value,
    isFetchMergeStatusLoading: mergeStatusState?.loading ?? false,
    fetchMergeStatusError: mergeStatusState?.error,
    fetchMergeStatus,
    clearMergeStatus,
  };
}
