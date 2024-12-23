import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectDiscardState } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useDiscard() {
  const { artifactDef } = useGitContext();
  const dispatch = useDispatch();

  const discardState = useSelector((state: GitRootState) =>
    selectDiscardState(state, artifactDef),
  );

  const discard = useCallback(() => {
    dispatch(gitArtifactActions.discardInit(artifactDef));
  }, [artifactDef, dispatch]);

  const clearDiscardError = useCallback(() => {
    dispatch(gitArtifactActions.clearDiscardError(artifactDef));
  }, [artifactDef, dispatch]);

  return {
    isDiscardLoading: discardState?.loading ?? false,
    discardError: discardState?.error ?? null,
    discard,
    clearDiscardError,
  };
}
