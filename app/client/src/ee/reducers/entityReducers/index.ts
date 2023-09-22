export * from "ce/reducers/entityReducers";
import { default as CE_entityReducer } from "ce/reducers/entityReducers";
import { combineReducers } from "redux";

const entityReducer = combineReducers({ ...CE_entityReducer });

export default entityReducer;
