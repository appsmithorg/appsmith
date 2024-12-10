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
import { gitConfigInitialState } from "./helpers/gitConfigInitialState";

export const gitConfigSlice = createSlice({
  name: "git/config",
  initialState: gitConfigInitialState,
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
