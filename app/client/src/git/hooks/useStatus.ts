import { useGitContext } from "git/components/GitContextProvider";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectStatusState } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useStatus() {
  const { artifactDef } = useGitContext();
  const dispatch = useDispatch();

  const statusState = useSelector((state: GitRootState) =>
    selectStatusState(state, artifactDef),
  );

  const fetchStatus = useCallback(() => {
    dispatch(
      gitArtifactActions.fetchStatusInit({
        ...artifactDef,
        compareRemote: true,
      }),
    );
  }, [artifactDef, dispatch]);

  return {
    status: statusState?.value,
    isFetchStatusLoading: statusState?.loading ?? false,
    fetchStatusError: statusState?.error,
    fetchStatus,
  };
}
