export * from "ce/reducers/entityReducers";
import { entityReducerObject as CE_entityReducerObject } from "ce/reducers/entityReducers";
import { combineReducers } from "redux";
import packageReducer from "@appsmith/reducers/packageReducer";

const entityReducer = combineReducers({
  ...CE_entityReducerObject,
  packages: packageReducer,
});

export default entityReducer;
