// useGlobaProfile same as useLocalProfile but it uses global state

import type { UpdateGlobalProfileRequestParams } from "git/requests/updateGlobalProfileRequest.types";
import { gitConfigActions } from "git/store/gitConfigSlice";
import { selectFetchGlobalProfileState } from "git/store/selectors/gitConfigSelectors";

import type { GitRootState } from "git/store/types";
import { useDispatch, useSelector } from "react-redux";

export default function useGlobalProfile() {
  const dispatch = useDispatch();
  const fetchGlobalProfileState = useSelector((state: GitRootState) =>
    selectFetchGlobalProfileState(state),
  );

  const fetchGlobalProfile = () => {
    dispatch(gitConfigActions.fetchGlobalProfileInit());
  };

  const updateGlobalProfileState = useSelector((state: GitRootState) =>
    selectFetchGlobalProfileState(state),
  );

  const updateGlobalProfile = (params: UpdateGlobalProfileRequestParams) => {
    dispatch(gitConfigActions.updateGlobalProfileInit(params));
  };

  return {
    globalProfile: fetchGlobalProfileState?.value ?? null,
    isFetchGlobalProfileLoading: fetchGlobalProfileState?.loading ?? false,
    fetchGlobalProfileError: fetchGlobalProfileState?.error ?? null,
    fetchGlobalProfile,
    isUpdateGlobalProfileLoading: updateGlobalProfileState?.loading ?? false,
    updateGlobalProfileError: updateGlobalProfileState?.error ?? null,
    updateGlobalProfile,
  };
}
