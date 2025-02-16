import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectCommitState } from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useCommit() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;

  const dispatch = useDispatch();

  const commitState = useArtifactSelector(selectCommitState);

  const commit = useCallback(
    (message: string) => {
      if (artifactDef && artifactId) {
        dispatch(
          gitArtifactActions.commitInit({
            artifactId,
            artifactDef,
            message,
            doPush: true,
          }),
        );
      }
    },
    [artifactDef, artifactId, dispatch],
  );

  const clearCommitError = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.clearCommitError({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  return {
    isCommitLoading: commitState?.loading ?? false,
    commitError: commitState?.error ?? null,
    commit,
    clearCommitError,
  };
}
