import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectStatusState } from "git/store/selectors/gitSingleArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useStatus() {
  const { artifact, artifactDef } = useGitContext();
  const artifactId = artifact?.id;
  const dispatch = useDispatch();

  const statusState = useArtifactSelector(selectStatusState);

  const fetchStatus = useCallback(() => {
    if (artifactDef && artifactId) {
      dispatch(
        gitArtifactActions.fetchStatusInit({
          artifactId,
          artifactDef,
          compareRemote: true,
        }),
      );
    }
  }, [artifactDef, artifactId, dispatch]);

  return {
    status: statusState?.value ?? null,
    isFetchStatusLoading: statusState?.loading ?? false,
    fetchStatusError: statusState?.error ?? null,
    fetchStatus,
  };
}
