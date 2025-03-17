import { useGitContext } from "git/components/GitContextProvider";
import useArtifactSelector from "./useArtifactSelector";
import { useDispatch } from "react-redux";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { useCallback } from "react";
import { selectPretagState } from "git/store/selectors/gitArtifactSelectors";

export default function usePretag() {
  const dispatch = useDispatch();
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;

  const pretagState = useArtifactSelector(selectPretagState);

  const fetchPretag = useCallback(() => {
    if (artifactDef && artifactId) {
      dispatch(gitArtifactActions.pretagInit({ artifactDef, artifactId }));
    }
  }, [artifactDef, artifactId, dispatch]);

  return {
    pretagResponse: pretagState?.value ?? null,
    isPretagLoading: pretagState?.loading ?? false,
    pretagError: pretagState?.error ?? null,
    fetchPretag,
  };
}
