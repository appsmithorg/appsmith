import { useGitContext } from "git/components/GitContextProvider";
import type { UpdateLocalProfileRequestParams } from "git/requests/updateLocalProfileRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  selectFetchLocalProfileState,
  selectUpdateLocalProfileState,
} from "git/store/selectors/gitArtifactSelectors";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import useArtifactSelector from "./useArtifactSelector";

export default function useLocalProfile() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const fetchLocalProfileState = useArtifactSelector(
    selectFetchLocalProfileState,
  );

  const fetchLocalProfile = useCallback(() => {
    if (artifactDef) {
      dispatch(gitArtifactActions.fetchLocalProfileInit({ artifactDef }));
    }
  }, [artifactDef, dispatch]);

  const updateLocalProfileState = useArtifactSelector(
    selectUpdateLocalProfileState,
  );

  const updateLocalProfile = useCallback(
    (params: UpdateLocalProfileRequestParams) => {
      if (artifactDef) {
        dispatch(
          gitArtifactActions.updateLocalProfileInit({
            artifactDef,
            ...params,
          }),
        );
      }
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
