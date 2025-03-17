import { combineReducers } from "@reduxjs/toolkit";
import { gitArtifactReducer } from "./gitArtifactSlice";
import { gitGlobalReducer } from "./gitGlobalSlice";
import { gitGlobalActions } from "./gitGlobalSlice";
import { gitArtifactActions } from "./gitArtifactSlice";

export const gitReducer = combineReducers({
  artifacts: gitArtifactReducer,
  global: gitGlobalReducer,
});

// actions
export const gitFetchGlobalProfile = gitGlobalActions.fetchGlobalProfileInit;
export const gitToggleImportModal = gitGlobalActions.toggleImportModal;
export const gitToggleOpsModal = gitArtifactActions.toggleOpsModal;
export const gitConnectSuccess = gitArtifactActions.connectSuccess;
export const gitDiscardSuccess = gitArtifactActions.discardSuccess;
export const gitCheckoutBranchSuccess =
  gitArtifactActions.checkoutBranchSuccess;
export const gitPullSuccess = gitArtifactActions.pullSuccess;
export const gitImportSuccess = gitGlobalActions.gitImportSuccess;
export const gitCreateReleaseTagInit = gitArtifactActions.createReleaseTagInit;
export const gitCreateReleaseTagSuccess =
  gitArtifactActions.createReleaseTagSuccess;
export const gitCreateReleaseTagError =
  gitArtifactActions.createReleaseTagError;
