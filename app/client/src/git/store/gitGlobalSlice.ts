import { createSlice } from "@reduxjs/toolkit";
import {
  fetchGlobalProfileErrorAction,
  fetchGlobalProfileInitAction,
  fetchGlobalProfileSuccessAction,
} from "./actions/fetchGlobalProfileActions";
import {
  updateGlobalProfileErrorAction,
  updateGlobalProfileInitAction,
  updateGlobalProfileSuccessAction,
} from "./actions/updateGlobalProfileActions";
import { gitGlobalInitialState } from "./helpers/initialState";
import {
  resetImportOverrideParamsAction,
  setImportOverrideParamsAction,
  toggleImportModalAction,
} from "./actions/uiActions";
import {
  gitImportErrorAction,
  gitImportInitAction,
  gitImportSuccessAction,
} from "./actions/gitImportActions";
import {
  fetchGlobalSSHKeyErrorAction,
  fetchGlobalSSHKeyInitAction,
  fetchGlobalSSHKeySuccessAction,
  resetGlobalSSHKeyAction,
} from "./actions/fetchGlobalSSHKeyActions";
import { toggleRepoLimitErrorModalAction } from "./actions/repoLimitErrorModalActions";

export const gitGlobalSlice = createSlice({
  name: "git/config",
  initialState: gitGlobalInitialState,
  reducers: {
    fetchGlobalProfileInit: fetchGlobalProfileInitAction,
    fetchGlobalProfileSuccess: fetchGlobalProfileSuccessAction,
    fetchGlobalProfileError: fetchGlobalProfileErrorAction,
    updateGlobalProfileInit: updateGlobalProfileInitAction,
    updateGlobalProfileSuccess: updateGlobalProfileSuccessAction,
    updateGlobalProfileError: updateGlobalProfileErrorAction,
    fetchGlobalSSHKeyInit: fetchGlobalSSHKeyInitAction,
    fetchGlobalSSHKeySuccess: fetchGlobalSSHKeySuccessAction,
    fetchGlobalSSHKeyError: fetchGlobalSSHKeyErrorAction,
    resetGlobalSSHKey: resetGlobalSSHKeyAction,
    gitImportInit: gitImportInitAction,
    gitImportSuccess: gitImportSuccessAction,
    gitImportError: gitImportErrorAction,
    toggleImportModal: toggleImportModalAction,
    resetImportOverrideParams: resetImportOverrideParamsAction,
    setImportOverrideParams: setImportOverrideParamsAction,
    toggleRepoLimitErrorModal: toggleRepoLimitErrorModalAction,
  },
});

export const gitGlobalActions = gitGlobalSlice.actions;

export const gitGlobalReducer = gitGlobalSlice.reducer;
