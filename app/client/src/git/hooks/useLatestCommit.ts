import { useGitContext } from "git/components/GitContextProvider";
import useArtifactSelector from "./useArtifactSelector";
import { selectLatestCommitState } from "git/store/selectors/gitArtifactSelectors";
import { useDispatch } from "react-redux";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { useCallback } from "react";

export default function useLatestCommit() {
  const dispatch = useDispatch();
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;

  const latestCommitState = useArtifactSelector(selectLatestCommitState);

  const fetchLatestCommit = useCallback(() => {
    if (artifactDef && artifactId) {
      dispatch(
        gitArtifactActions.fetchLatestCommitInit({ artifactDef, artifactId }),
      );
    }
  }, [artifactDef, artifactId, dispatch]);

  return {
    latestCommit: latestCommitState?.value ?? null,
    isLatestCommitLoading: latestCommitState?.loading ?? false,
    latestCommitError: latestCommitState?.error ?? null,
    fetchLatestCommit,
  };
}
