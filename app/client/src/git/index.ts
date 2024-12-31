// enums
export { GitArtifactType, GitOpsTab } from "./constants/enums";

// components
export { default as GitContextProvider } from "./components/GitContextProvider";
export { default as GitModals } from "./ee/components/GitModals";
export { default as GitImportModal } from "./components/ImportModal";
export { default as GitRepoLimitErrorModal } from "./components/RepoLimitErrorModal";
export { default as GitQuickActions } from "./components/QuickActions";
export { default as GitProtectedBranchCallout } from "./components/ProtectedBranchCallout";
export { default as GitGlobalProfile } from "./components/GlobalProfile";
export { default as GitDeployMenuItems } from "./components/DeployMenuItems";
export { default as GitHotKeys } from "./components/HotKeys";

// hooks
export { default as useGitCurrentBranch } from "./hooks/useCurrentBranch";
export { default as useGitProtectedMode } from "./hooks/useProtectedMode";
export { default as useGitConnected } from "./hooks/useConnected";
export { default as useGitOps } from "./hooks/useOps";

// actions
import { gitGlobalActions } from "./store/gitGlobalSlice";
export const fetchGitGlobalProfile = gitGlobalActions.fetchGlobalProfileInit;
export const toggleGitImportModal = gitGlobalActions.toggleImportModal;

import { gitArtifactActions } from "./store/gitArtifactSlice";
export const gitConnectSuccess = gitArtifactActions.connectSuccess;

// selectors
export {
  selectCurrentBranch as selectGitCurrentBranch,
  selectProtectedMode as selectGitProtectedMode,
  selectOpsModalOpen as selectGitOpsModalOpen,
  selectConnectModalOpen as selectGitConnectModalOpen,
} from "./store/selectors/gitArtifactSelectors";

// types
export type {
  GitArtifactDef,
  GitArtifactRootReduxState,
  GitGlobalReduxState,
} from "./store/types";
export type { ConnectSuccessPayload as GitConnectSuccessPayload } from "./store/actions/connectActions";
