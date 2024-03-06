export * from "ce/reducers/uiReducers";
import { uiReducerObject as CE_uiReducerObject } from "ce/reducers/uiReducers";
import { combineReducers } from "redux";
import moduleInstancePane from "./moduleInstancePaneReducer";
import gitExtendedReducer from "./gitExtendedReducer";
import workflowHistoryPane from "./workflowHistoryPaneReducer";

const uiReducer = combineReducers({
  ...CE_uiReducerObject,
  moduleInstancePane,
  gitExtended: gitExtendedReducer,
  workflowHistoryPane,
});

export default uiReducer;
