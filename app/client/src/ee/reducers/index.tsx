export * from "ce/reducers";
import { reducerObject as CE_AppReducer } from "ce/reducers";
import { combineReducers } from "redux";

const appReducer = combineReducers({ ...CE_AppReducer });

export default appReducer;
