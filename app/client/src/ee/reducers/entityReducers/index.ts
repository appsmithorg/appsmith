export * from "ce/reducers/entityReducers";
import { entityReducerObject as CE_entityReducerObject } from "ce/reducers/entityReducers";
import { combineReducers } from "redux";

const entityReducer = combineReducers({ ...CE_entityReducerObject });

export default entityReducer;
