import { useGitContext } from "git/components/GitContextProvider";
import type { UpdateLocalProfileRequestParams } from "git/requests/updateLocalProfileRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectFetchLocalProfileState,
  selectUpdateLocalProfileState,
} from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useLocalProfile() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const fetchLocalProfileState = useSelector((state: GitRootState) =>
    selectFetchLocalProfileState(state, artifactDef),
  );

  const fetchLocalProfile = useCallback(() => {
    dispatch(gitArtifactActions.fetchLocalProfileInit(artifactDef));
  }, [artifactDef, dispatch]);

  const updateLocalProfileState = useSelector((state: GitRootState) =>
    selectUpdateLocalProfileState(state, artifactDef),
  );

  const updateLocalProfile = useCallback(
    (params: UpdateLocalProfileRequestParams) => {
      dispatch(
        gitArtifactActions.updateLocalProfileInit({
          ...artifactDef,
          ...params,
        }),
      );
    },
    [artifactDef, dispatch],
  );

  return {
    localProfile: fetchLocalProfileState?.value ?? null,
    isFetchLocalProfileLoading: fetchLocalProfileState?.loading ?? false,
    fetchLocalProfileError: fetchLocalProfileState?.error ?? null,
    fetchLocalProfile,
    isUpdateLocalProfileLoading: updateLocalProfileState?.loading ?? false,
    updateLocalProfileError: updateLocalProfileState?.error ?? null,
    updateLocalProfile,
  };
}
