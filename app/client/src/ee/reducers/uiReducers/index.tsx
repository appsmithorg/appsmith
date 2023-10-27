export * from "ce/reducers/uiReducers";
import { uiReducerObject as CE_uiReducerObject } from "ce/reducers/uiReducers";
import { combineReducers } from "redux";
import moduleInstancePane from "./moduleInstancePaneReducer";

const uiReducer = combineReducers({
  ...CE_uiReducerObject,
  moduleInstancePane,
});

export default uiReducer;
