import type { UpdateGlobalProfileRequestParams } from "git/requests/updateGlobalProfileRequest.types";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import {
  selectFetchGlobalProfileState,
  selectUpdateGlobalProfileState,
} from "git/store/selectors/gitGlobalSelectors";

import type { GitRootState } from "git/store/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useGlobalProfile() {
  const dispatch = useDispatch();
  const fetchGlobalProfileState = useSelector((state: GitRootState) =>
    selectFetchGlobalProfileState(state),
  );

  const fetchGlobalProfile = useCallback(() => {
    dispatch(gitGlobalActions.fetchGlobalProfileInit());
  }, [dispatch]);

  const updateGlobalProfileState = useSelector((state: GitRootState) =>
    selectUpdateGlobalProfileState(state),
  );

  const updateGlobalProfile = useCallback(
    (params: UpdateGlobalProfileRequestParams) => {
      dispatch(gitGlobalActions.updateGlobalProfileInit(params));
    },
    [dispatch],
  );

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
