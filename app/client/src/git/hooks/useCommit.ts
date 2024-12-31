import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectCommitState } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useCommit() {
  const { artifactDef } = useGitContext();
  const dispatch = useDispatch();

  const commitState = useSelector((state: GitRootState) =>
    selectCommitState(state, artifactDef),
  );

  const commit = useCallback(
    (commitMessage: string) => {
      dispatch(
        gitArtifactActions.commitInit({
          ...artifactDef,
          commitMessage,
          doPush: true,
        }),
      );
    },
    [artifactDef, dispatch],
  );

  const clearCommitError = useCallback(() => {
    dispatch(gitArtifactActions.clearCommitError(artifactDef));
  }, [artifactDef, dispatch]);

  return {
    isCommitLoading: commitState?.loading ?? false,
    commitError: commitState?.error,
    commit,
    clearCommitError,
  };
}
