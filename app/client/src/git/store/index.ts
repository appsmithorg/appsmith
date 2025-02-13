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
export const fetchGitGlobalProfile = gitGlobalActions.fetchGlobalProfileInit;
export const toggleGitImportModal = gitGlobalActions.toggleImportModal;
export const gitConnectSuccess = gitArtifactActions.connectSuccess;
