import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectPullState } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function usePull() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;
  const dispatch = useDispatch();

  const pullState = useSelector((state: GitRootState) =>
    selectPullState(state, artifactDef),
  );

  const pull = useCallback(() => {
    dispatch(
      gitArtifactActions.pullInit({
        ...artifactDef,
        artifactId: artifactId ?? "",
      }),
    );
  }, [artifactDef, artifactId, dispatch]);

  return {
    isPullLoading: pullState?.loading ?? false,
    pullError: pullState?.error,
    pull,
  };
}
