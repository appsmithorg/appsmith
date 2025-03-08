import { selectCreateReleaseTagState } from "git/store/selectors/gitArtifactSelectors";
import useArtifactSelector from "./useArtifactSelector";
import { useGitContext } from "git/components/GitContextProvider";
import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { gitArtifactActions } from "git/store/gitArtifactSlice";

function useReleaseTag() {
  const dispatch = useDispatch();
  const { artifact, artifactDef } = useGitContext();

  const createReleaseTagState = useArtifactSelector(
    selectCreateReleaseTagState,
  );

  const createReleaseTag = useCallback(
    (params: { tag: string; releaseNote: string; commitSHA: string }) => {
      if (artifactDef && artifact) {
        dispatch(
          gitArtifactActions.createReleaseTagInit({
            artifactDef,
            artifactId: artifact.id,
            ...params,
          }),
        );
      }
    },
    [dispatch, artifactDef, artifact],
  );

  return {
    isCreateReleaseTagLoading: createReleaseTagState?.loading ?? false,
    createReleaseTagError: createReleaseTagState?.error ?? null,
    createReleaseTag,
  };
}

export default useReleaseTag;
