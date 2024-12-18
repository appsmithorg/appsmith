import { combineReducers } from "@reduxjs/toolkit";
import { gitArtifactReducer } from "./gitArtifactSlice";
import { gitConfigReducer } from "./gitConfigSlice";

export const gitReducer = combineReducers({
  artifacts: gitArtifactReducer,
  config: gitConfigReducer,
});
