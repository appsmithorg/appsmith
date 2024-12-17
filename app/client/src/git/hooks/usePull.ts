import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectPullState } from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useAritfactSelector from "./useArtifactSelector";

export default function usePull() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;
  const dispatch = useDispatch();

  const pullState = useAritfactSelector(selectPullState);

  const pull = useCallback(() => {
    if (artifactDef) {
      dispatch(
        gitArtifactActions.pullInit({
          artifactDef,
          artifactId: artifactId ?? "",
        }),
      );
    }
  }, [artifactDef, artifactId, dispatch]);

  return {
    isPullLoading: pullState?.loading ?? false,
    pullError: pullState?.error,
    pull,
  };
}
