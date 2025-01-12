import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectDiscardState } from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useDiscard() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;
  const dispatch = useDispatch();

  const discardState = useArtifactSelector(selectDiscardState);

  const discard = useCallback(() => {
    if (artifactDef && artifactId) {
      dispatch(gitArtifactActions.discardInit({ artifactDef, artifactId }));
    }
  }, [artifactDef, artifactId, dispatch]);

  const clearDiscardError = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.clearDiscardError({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  return {
    isDiscardLoading: discardState?.loading ?? false,
    discardError: discardState?.error ?? null,
    discard,
    clearDiscardError,
  };
}
