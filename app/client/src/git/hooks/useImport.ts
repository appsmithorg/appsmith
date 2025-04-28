import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectGitImportState,
  selectImportModalOpen,
  selectImportOverrideDetails,
  selectImportOverrideModalOpen,
} from "git/store/selectors/gitGlobalSelectors";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";
import type { SetImportOverrideDetailsPayload } from "git/store/actions/uiActions";

export default function useImport() {
  const dispatch = useDispatch();

  const gitImportState = useSelector(selectGitImportState);

  const gitImport = useCallback(
    (params: GitImportRequestParams) => {
      dispatch(gitGlobalActions.gitImportInit(params));
    },
    [dispatch],
  );

  const resetGitImport = useCallback(() => {
    dispatch(gitGlobalActions.resetGitImport());
  }, [dispatch]);

  const isImportModalOpen = useSelector(selectImportModalOpen);

  const toggleImportModal = useCallback(
    (open: boolean) => {
      dispatch(gitGlobalActions.toggleImportModal({ open }));
    },
    [dispatch],
  );

  const isImportOverrideModalOpen = useSelector(selectImportOverrideModalOpen);

  const importOverrideDetails = useSelector(selectImportOverrideDetails);

  const setImportOverrideDetails = useCallback(
    (details: SetImportOverrideDetailsPayload) => {
      dispatch(gitGlobalActions.setImportOverrideDetails(details));
    },
    [dispatch],
  );

  const resetImportOverrideDetails = useCallback(() => {
    dispatch(gitGlobalActions.resetImportOverrideDetails());
  }, [dispatch]);

  return {
    isGitImportLoading: gitImportState?.loading ?? false,
    gitImportError: gitImportState?.error ?? null,
    gitImport,
    resetGitImport,
    isImportModalOpen: isImportModalOpen ?? false,
    toggleImportModal,
    isImportOverrideModalOpen: isImportOverrideModalOpen ?? false,
    importOverrideDetails,
    setImportOverrideDetails,
    resetImportOverrideDetails,
  };
}
