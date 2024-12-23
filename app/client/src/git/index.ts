// enums
export { GitArtifactType } from "./constants/enums";

// components
export { default as GitContextProvider } from "./components/GitContextProvider";
export { default as GitModals } from "./ee/components/GitModals";
export { default as GitImportModal } from "./components/ImportModal";
export { default as GitQuickActions } from "./components/QuickActions";
export { default as GitProtectedBranchCallout } from "./components/ProtectedBranchCallout";
export { default as GitGlobalProfile } from "./components/GlobalProfile";

// hooks
export { default as useGitCurrentBranch } from "./hooks/useCurrentBranch";
export { default as useGitProtectedMode } from "./hooks/useProtectedMode";
export { default as useGitConnected } from "./hooks/useConnected";

// actions
import { gitGlobalActions } from "./store/gitGlobalSlice";
export const fetchGitGlobalProfile = gitGlobalActions.fetchGlobalProfileInit;
export const toggleGitImportModal = gitGlobalActions.toggleImportModal;

// reducer
export { gitReducer } from "./store";

// selectors
export {
  selectCurrentBranch as selectGitCurrentBranch,
  selectProtectedMode as selectGitProtectedMode,
} from "./store/selectors/gitArtifactSelectors";

// sagas
export { default as gitSagas } from "./sagas";

// types
export type {
  GitArtifactDef,
  GitArtifactRootReduxState,
  GitGlobalReduxState,
} from "./store/types";
