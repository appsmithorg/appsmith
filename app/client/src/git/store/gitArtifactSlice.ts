/* eslint-disable padding-line-between-statements */
import { createSlice } from "@reduxjs/toolkit";
import type { GitArtifactReduxState } from "../types";
import { mountAction, unmountAction } from "../actions/mountActions";
import {
  connectErrorAction,
  connectInitAction,
  connectSuccessAction,
} from "../actions/connectActions";
import {
  fetchMetadataErrorAction,
  fetchMetadataInitAction,
  fetchMetadataSuccessAction,
} from "../actions/fetchMetadataActions";
import {
  fetchBranchesErrorAction,
  fetchBranchesInitAction,
  fetchBranchesSuccessAction,
} from "../actions/fetchBranchesActions";
import {
  fetchStatusErrorAction,
  fetchStatusInitAction,
  fetchStatusSuccessAction,
} from "../actions/fetchStatusActions";
import {
  commitErrorAction,
  commitInitAction,
  commitSuccessAction,
} from "../actions/commitActions";
import {
  pullErrorAction,
  pullInitAction,
  pullSuccessAction,
} from "../actions/pullActions";
import { toggleRepoLimitErrorModalAction } from "../actions/repoLimitErrorModalActions";

const initialState: GitArtifactReduxState = {};

export const gitArtifactSlice = createSlice({
  name: "git",
  initialState,
  reducers: {
    mount: mountAction,
    unmount: unmountAction,
    connectInit: connectInitAction,
    connectSuccess: connectSuccessAction,
    connectError: connectErrorAction,
    fetchMetadataInit: fetchMetadataInitAction,
    fetchMetadataSuccess: fetchMetadataSuccessAction,
    fetchMetadataError: fetchMetadataErrorAction,
    fetchBranchesInit: fetchBranchesInitAction,
    fetchBranchesSuccess: fetchBranchesSuccessAction,
    fetchBranchesError: fetchBranchesErrorAction,
    fetchStatusInit: fetchStatusInitAction,
    fetchStatusSuccess: fetchStatusSuccessAction,
    fetchStatusError: fetchStatusErrorAction,
    commitInit: commitInitAction,
    commitSuccess: commitSuccessAction,
    commitError: commitErrorAction,
    pullInit: pullInitAction,
    pullSuccess: pullSuccessAction,
    pullError: pullErrorAction,
    toggleRepoLimitErrorModal: toggleRepoLimitErrorModalAction,
  },
});

export const gitArtifactActions = gitArtifactSlice.actions;

export const gitArtifactReducer = gitArtifactSlice.reducer;
