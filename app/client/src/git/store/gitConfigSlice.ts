import { createSlice } from "@reduxjs/toolkit";
import {
  fetchGlobalProfileErrorAction,
  fetchGlobalProfileInitAction,
  fetchGlobalProfileSuccessAction,
} from "git/actions/fetchGlobalProfileActions";
import {
  updateGlobalProfileErrorAction,
  updateGlobalProfileInitAction,
  updateGlobalProfileSuccessAction,
} from "git/actions/updateGlobalProfileActions";
import type { GitConfigReduxState } from "git/types";

const initialState: GitConfigReduxState = {
  globalProfile: {
    value: null,
    loading: false,
    error: null,
  },
  updateGlobalProfile: {
    loading: false,
    error: null,
  },
};

export const gitConfigSlice = createSlice({
  name: "git/config",
  initialState,
  reducers: {
    fetchGlobalProfileInit: fetchGlobalProfileInitAction,
    fetchGlobalProfileSuccess: fetchGlobalProfileSuccessAction,
    fetchGlobalProfileError: fetchGlobalProfileErrorAction,
    updateGlobalProfileInit: updateGlobalProfileInitAction,
    updateGlobalProfileSuccess: updateGlobalProfileSuccessAction,
    updateGlobalProfileError: updateGlobalProfileErrorAction,
  },
});

export const gitConfigActions = gitConfigSlice.actions;

export const gitConfigReducer = gitConfigSlice.reducer;
