import { useGitContext } from "git/components/GitContextProvider";
import type { UpdateLocalProfileRequestParams } from "git/requests/updateLocalProfileRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectFetchGlobalProfileState } from "git/store/selectors/gitConfigSelectors";
import { selectFetchLocalProfileState } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitRootState } from "git/store/types";
import { useDispatch, useSelector } from "react-redux";

export default function useLocalProfile() {
  const { artifactDef } = useGitContext();

  const dispatch = useDispatch();

  const fetchLocalProfileState = useSelector((state: GitRootState) =>
    selectFetchLocalProfileState(state, artifactDef),
  );

  const fetchLocalProfile = () => {
    dispatch(gitArtifactActions.fetchLocalProfileInit(artifactDef));
  };

  const updateLocalProfileState = useSelector((state: GitRootState) =>
    selectFetchGlobalProfileState(state),
  );

  const updateLocalProfile = (params: UpdateLocalProfileRequestParams) => {
    dispatch(
      gitArtifactActions.updateLocalProfileInit({
        ...artifactDef,
        ...params,
      }),
    );
  };

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
