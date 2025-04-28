import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectGitImportState,
  selectImportModalOpen,
  selectImportOverrideModalOpen,
  selectImportOverrideParams,
} from "git/store/selectors/gitGlobalSelectors";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import type { GitImportRequestParams } from "git/requests/gitImportRequest.types";

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

  const importOverrideParams = useSelector(selectImportOverrideParams);

  const setImportOverrideParams = useCallback(
    (params: GitImportRequestParams) => {
      dispatch(gitGlobalActions.setImportOverrideParams(params));
    },
    [dispatch],
  );

  const resetImportOverrideParams = useCallback(() => {
    dispatch(gitGlobalActions.resetImportOverrideParams());
  }, [dispatch]);

  return {
    isGitImportLoading: gitImportState?.loading ?? false,
    gitImportError: gitImportState?.error ?? null,
    gitImport,
    resetGitImport,
    isImportModalOpen: isImportModalOpen ?? false,
    toggleImportModal,
    isImportOverrideModalOpen: isImportOverrideModalOpen ?? false,
    importOverrideParams,
    setImportOverrideParams,
    resetImportOverrideParams,
  };
}
