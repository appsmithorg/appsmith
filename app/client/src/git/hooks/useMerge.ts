import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectMergeState,
  selectMergeStatusState,
  selectMergeSuccess,
} from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useMerge() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;
  const dispatch = useDispatch();

  // merge
  const mergeState = useArtifactSelector(selectMergeState);

  const merge = useCallback(
    (sourceBranch, destinationBranch) => {
      if (artifactDef && artifactId) {
        dispatch(
          gitArtifactActions.mergeInit({
            artifactDef,
            artifactId,
            sourceBranch,
            destinationBranch,
          }),
        );
      }
    },
    [artifactDef, artifactId, dispatch],
  );

  // merge status
  const mergeStatusState = useArtifactSelector(selectMergeStatusState);

  const fetchMergeStatus = useCallback(
    (sourceBranch: string, destinationBranch: string) => {
      if (artifactDef && artifactId) {
        dispatch(
          gitArtifactActions.fetchMergeStatusInit({
            artifactDef,
            artifactId,
            sourceBranch,
            destinationBranch,
          }),
        );
      }
    },
    [artifactId, artifactDef, dispatch],
  );

  const clearMergeStatus = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.clearMergeStatus({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  const isMergeSuccess = useArtifactSelector(selectMergeSuccess);

  const resetMergeState = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.resetMergeState({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  return {
    isMergeLoading: mergeState?.loading ?? false,
    mergeError: mergeState?.error ?? null,
    merge,
    mergeStatus: mergeStatusState?.value ?? null,
    isFetchMergeStatusLoading: mergeStatusState?.loading ?? false,
    fetchMergeStatusError: mergeStatusState?.error ?? null,
    fetchMergeStatus,
    clearMergeStatus,
    isMergeSuccess: isMergeSuccess ?? false,
    resetMergeState,
  };
}
