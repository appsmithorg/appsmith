import { combineReducers } from "@reduxjs/toolkit";
import { gitArtifactReducer } from "./gitArtifactSlice";
import { gitGlobalReducer } from "./gitGlobalSlice";

export const gitReducer = combineReducers({
  artifacts: gitArtifactReducer,
  global: gitGlobalReducer,
});
