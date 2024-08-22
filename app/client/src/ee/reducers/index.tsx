import { reducerObject as CE_AppReducer } from "ce/reducers";
import { combineReducers } from "redux";

export * from "ce/reducers";

const appReducer = combineReducers({ ...CE_AppReducer });

export default appReducer;
