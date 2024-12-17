import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectDiscardState } from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useAritfactSelector from "./useArtifactSelector";

export default function useDiscard() {
  const { artifactDef } = useGitContext();
  const dispatch = useDispatch();

  const discardState = useAritfactSelector(selectDiscardState);

  const discard = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.discardInit({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

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
