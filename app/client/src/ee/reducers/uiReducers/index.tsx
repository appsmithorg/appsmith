import { uiReducerObject as CE_uiReducerObject } from "ce/reducers/uiReducers";
import { combineReducers } from "redux";

export * from "ce/reducers/uiReducers";

const uiReducer = combineReducers({ ...CE_uiReducerObject });

export default uiReducer;
