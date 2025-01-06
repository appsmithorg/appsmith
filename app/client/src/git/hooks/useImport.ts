import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectGitImportState,
  selectImportModalOpen,
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

  const isImportModalOpen = useSelector(selectImportModalOpen);

  const toggleImportModal = useCallback(
    (open: boolean) => {
      dispatch(gitGlobalActions.toggleImportModal({ open }));
    },
    [dispatch],
  );

  return {
    isGitImportLoading: gitImportState?.loading ?? false,
    gitImportError: gitImportState?.error ?? null,
    gitImport,
    isImportModalOpen: isImportModalOpen ?? false,
    toggleImportModal,
  };
}
