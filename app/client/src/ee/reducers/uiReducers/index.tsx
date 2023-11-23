export * from "ce/reducers/uiReducers";
import { uiReducerObject as CE_uiReducerObject } from "ce/reducers/uiReducers";
import { combineReducers } from "redux";

const uiReducer = combineReducers({ ...CE_uiReducerObject });

export default uiReducer;
