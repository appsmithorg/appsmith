export * from "ce/reducers/uiReducers";
import { uiReducerObject as CE_uiReducerObject } from "ce/reducers/uiReducers";
import { combineReducers } from "redux";
import moduleInstancePane from "./moduleInstancePaneReducer";
import gitExtendedReducer from "./gitExtendedReducer";

const uiReducer = combineReducers({
  ...CE_uiReducerObject,
  moduleInstancePane,
  gitExtended: gitExtendedReducer,
});

export default uiReducer;
