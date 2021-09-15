import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { GitSyncModalTab } from "entities/GitSync";

const initialState: GitSyncReducerState = {
  isGitSyncModalOpen: false,
  isCommitting: false,
  activeGitSyncModalTab: GitSyncModalTab.GIT_CONNECTION,
  isErrorPopupVisible: false,
  gitError: `
    README.md app/client/cypress/support/commands.js
    app/client/src/comments/CommentsShowcaseCarousel/CommentsCarouselModal.tsx
  `,
  isImportAppViaGitModalOpen: false,
};

const gitSyncReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<{
      isOpen: boolean;
      tab: GitSyncModalTab;
    }>,
  ) => {
    const activeGitSyncModalTab =
      action.payload.tab || state.activeGitSyncModalTab;
    return {
      ...state,
      isGitSyncModalOpen: action.payload.isOpen,
      activeGitSyncModalTab,
    };
  },
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isCommitting: true,
  }),
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_SUCCESS]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitting: false,
  }),
  [ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitting: false,
  }),
  [ReduxActionTypes.SHOW_ERROR_POPUP]: (
    state: GitSyncReducerState,
    action: ReduxAction<{ isVisible: boolean }>,
  ) => ({
    ...state,
    isErrorPopupVisible: action.payload.isVisible,
  }),
  [ReduxActionTypes.SET_IS_IMPORT_APP_VIA_GIT_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<{ isOpen: boolean; organizationId: string }>,
  ) => ({
    ...state,
    isImportAppViaGitModalOpen: action.payload.isOpen,
    organisationIdForImport: action.payload.organizationId,
  }),
});

export type GitSyncReducerState = {
  isGitSyncModalOpen: boolean;
  isCommitting: boolean;
  activeGitSyncModalTab: GitSyncModalTab;
  isErrorPopupVisible: boolean;
  gitError: string;
  isImportAppViaGitModalOpen: boolean;
  organizationIdForImport?: string;
};

export default gitSyncReducer;
