import { entityReducerObject as CE_entityReducerObject } from "ce/reducers/entityReducers";
import { combineReducers } from "redux";

export * from "ce/reducers/entityReducers";

const entityReducer = combineReducers({ ...CE_entityReducerObject });

export default entityReducer;
