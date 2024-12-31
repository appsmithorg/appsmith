import { createSlice } from "@reduxjs/toolkit";
import type { GitArtifactRootReduxState } from "./types";
import { mountAction, unmountAction } from "./actions/mountActions";
import {
  connectErrorAction,
  connectInitAction,
  connectSuccessAction,
} from "./actions/connectActions";
import {
  fetchMetadataErrorAction,
  fetchMetadataInitAction,
  fetchMetadataSuccessAction,
} from "./actions/fetchMetadataActions";
import {
  fetchBranchesErrorAction,
  fetchBranchesInitAction,
  fetchBranchesSuccessAction,
} from "./actions/fetchBranchesActions";
import {
  fetchStatusErrorAction,
  fetchStatusInitAction,
  fetchStatusSuccessAction,
} from "./actions/fetchStatusActions";
import {
  clearCommitErrorAction,
  commitErrorAction,
  commitInitAction,
  commitSuccessAction,
} from "./actions/commitActions";
import {
  pullErrorAction,
  pullInitAction,
  pullSuccessAction,
} from "./actions/pullActions";
import {
  fetchLocalProfileErrorAction,
  fetchLocalProfileInitAction,
  fetchLocalProfileSuccessAction,
} from "./actions/fetchLocalProfileActions";
import {
  updateLocalProfileErrorAction,
  updateLocalProfileInitAction,
  updateLocalProfileSuccessAction,
} from "./actions/updateLocalProfileActions";
import {
  createBranchErrorAction,
  createBranchInitAction,
  createBranchSuccessAction,
} from "./actions/createBranchActions";
import {
  deleteBranchErrorAction,
  deleteBranchInitAction,
  deleteBranchSuccessAction,
} from "./actions/deleteBranchActions";
import {
  toggleBranchPopupAction,
  toggleConnectModalAction,
  toggleOpsModalAction,
  toggleSettingsModalAction,
  toggleConflictErrorModalAction,
  openDisconnectModalAction,
  closeDisconnectModalAction,
  toggleAutocommitDisableModalAction,
  toggleConnectSuccessModalAction,
} from "./actions/uiActions";
import {
  checkoutBranchErrorAction,
  checkoutBranchInitAction,
  checkoutBranchSuccessAction,
} from "./actions/checkoutBranchActions";
import {
  clearDiscardErrorAction,
  discardErrorAction,
  discardInitAction,
  discardSuccessAction,
} from "./actions/discardActions";
import {
  clearMergeStatusAction,
  fetchMergeStatusErrorAction,
  fetchMergeStatusInitAction,
  fetchMergeStatusSuccessAction,
} from "./actions/fetchMergeStatusActions";
import {
  mergeErrorAction,
  mergeInitAction,
  mergeSuccessAction,
  resetMergeStateAction,
} from "./actions/mergeActions";
import {
  pollAutocommitProgressStopAction,
  pollAutocommitProgressStartAction,
  triggerAutocommitErrorAction,
  triggerAutocommitInitAction,
  triggerAutocommitSuccessAction,
} from "./actions/triggerAutocommitActions";
import {
  toggleAutocommitErrorAction,
  toggleAutocommitInitAction,
  toggleAutocommitSuccessAction,
} from "./actions/toggleAutocommitActions";
import {
  fetchProtectedBranchesErrorAction,
  fetchProtectedBranchesInitAction,
  fetchProtectedBranchesSuccessAction,
} from "./actions/fetchProtectedBranchesActions";
import {
  updateProtectedBranchesErrorAction,
  updateProtectedBranchesInitAction,
  updateProtectedBranchesSuccessAction,
} from "./actions/updateProtectedBranchesActions";
import { initGitForEditorAction } from "./actions/initGitActions";
import {
  fetchAutocommitProgressErrorAction,
  fetchAutocommitProgressInitAction,
  fetchAutocommitProgressSuccessAction,
} from "./actions/fetchAutocommitProgressActions";
import { gitArtifactCaseReducers } from "git/ee/store/actions";
import {
  disconnectErrorAction,
  disconnectInitAction,
  disconnectSuccessAction,
} from "./actions/disconnectActions";
import {
  fetchSSHKeyErrorAction,
  fetchSSHKeyInitAction,
  fetchSSHKeySuccessAction,
  resetFetchSSHKeyAction,
} from "./actions/fetchSSHKeyActions";
import {
  generateSSHKeyErrorAction,
  generateSSHKeyInitAction,
  generateSSHKeySuccessAction,
  resetGenerateSSHKeyAction,
} from "./actions/generateSSHKeyActions";

const initialState: GitArtifactRootReduxState = {};

export const gitArtifactSlice = createSlice({
  name: "git/artifact",
  reducerPath: "git.artifact",
  initialState,
  reducers: {
    // init
    initGitForEditor: initGitForEditorAction,
    mount: mountAction,
    unmount: unmountAction,
    fetchMetadataInit: fetchMetadataInitAction,
    fetchMetadataSuccess: fetchMetadataSuccessAction,
    fetchMetadataError: fetchMetadataErrorAction,

    // connect
    connectInit: connectInitAction,
    connectSuccess: connectSuccessAction,
    connectError: connectErrorAction,
    fetchSSHKeyInit: fetchSSHKeyInitAction,
    fetchSSHKeySuccess: fetchSSHKeySuccessAction,
    fetchSSHKeyError: fetchSSHKeyErrorAction,
    resetFetchSSHKey: resetFetchSSHKeyAction,
    generateSSHKeyInit: generateSSHKeyInitAction,
    generateSSHKeySuccess: generateSSHKeySuccessAction,
    generateSSHKeyError: generateSSHKeyErrorAction,
    resetGenerateSSHKey: resetGenerateSSHKeyAction,
    disconnectInit: disconnectInitAction,
    disconnectSuccess: disconnectSuccessAction,
    disconnectError: disconnectErrorAction,
    toggleConnectModal: toggleConnectModalAction,
    toggleConnectSuccessModal: toggleConnectSuccessModalAction,
    openDisconnectModal: openDisconnectModalAction,
    closeDisconnectModal: closeDisconnectModalAction,

    // git ops
    commitInit: commitInitAction,
    commitSuccess: commitSuccessAction,
    commitError: commitErrorAction,
    clearCommitError: clearCommitErrorAction,
    discardInit: discardInitAction,
    discardSuccess: discardSuccessAction,
    discardError: discardErrorAction,
    clearDiscardError: clearDiscardErrorAction,
    fetchStatusInit: fetchStatusInitAction,
    fetchStatusSuccess: fetchStatusSuccessAction,
    fetchStatusError: fetchStatusErrorAction,
    fetchMergeStatusInit: fetchMergeStatusInitAction,
    fetchMergeStatusSuccess: fetchMergeStatusSuccessAction,
    fetchMergeStatusError: fetchMergeStatusErrorAction,
    clearMergeStatus: clearMergeStatusAction,
    mergeInit: mergeInitAction,
    mergeSuccess: mergeSuccessAction,
    mergeError: mergeErrorAction,
    resetMergeState: resetMergeStateAction,
    pullInit: pullInitAction,
    pullSuccess: pullSuccessAction,
    pullError: pullErrorAction,
    toggleOpsModal: toggleOpsModalAction,
    toggleConflictErrorModal: toggleConflictErrorModalAction,

    // branches
    fetchBranchesInit: fetchBranchesInitAction,
    fetchBranchesSuccess: fetchBranchesSuccessAction,
    fetchBranchesError: fetchBranchesErrorAction,
    createBranchInit: createBranchInitAction,
    createBranchSuccess: createBranchSuccessAction,
    createBranchError: createBranchErrorAction,
    deleteBranchInit: deleteBranchInitAction,
    deleteBranchSuccess: deleteBranchSuccessAction,
    deleteBranchError: deleteBranchErrorAction,
    checkoutBranchInit: checkoutBranchInitAction,
    checkoutBranchSuccess: checkoutBranchSuccessAction,
    checkoutBranchError: checkoutBranchErrorAction,
    toggleBranchPopup: toggleBranchPopupAction,

    // settings
    toggleSettingsModal: toggleSettingsModalAction,
    fetchLocalProfileInit: fetchLocalProfileInitAction,
    fetchLocalProfileSuccess: fetchLocalProfileSuccessAction,
    fetchLocalProfileError: fetchLocalProfileErrorAction,
    updateLocalProfileInit: updateLocalProfileInitAction,
    updateLocalProfileSuccess: updateLocalProfileSuccessAction,
    updateLocalProfileError: updateLocalProfileErrorAction,
    fetchProtectedBranchesInit: fetchProtectedBranchesInitAction,
    fetchProtectedBranchesSuccess: fetchProtectedBranchesSuccessAction,
    fetchProtectedBranchesError: fetchProtectedBranchesErrorAction,
    updateProtectedBranchesInit: updateProtectedBranchesInitAction,
    updateProtectedBranchesSuccess: updateProtectedBranchesSuccessAction,
    updateProtectedBranchesError: updateProtectedBranchesErrorAction,

    // autocommit
    toggleAutocommitInit: toggleAutocommitInitAction,
    toggleAutocommitSuccess: toggleAutocommitSuccessAction,
    toggleAutocommitError: toggleAutocommitErrorAction,
    triggerAutocommitInit: triggerAutocommitInitAction,
    triggerAutocommitSuccess: triggerAutocommitSuccessAction,
    triggerAutocommitError: triggerAutocommitErrorAction,
    fetchAutocommitProgressInit: fetchAutocommitProgressInitAction,
    fetchAutocommitProgressSuccess: fetchAutocommitProgressSuccessAction,
    fetchAutocommitProgressError: fetchAutocommitProgressErrorAction,
    pollAutocommitProgressStart: pollAutocommitProgressStartAction,
    pollAutocommitProgressStop: pollAutocommitProgressStopAction,
    toggleAutocommitDisableModal: toggleAutocommitDisableModalAction,

    ...gitArtifactCaseReducers,
  },
});

export const gitArtifactActions = gitArtifactSlice.actions;

export const gitArtifactReducer = gitArtifactSlice.reducer;
