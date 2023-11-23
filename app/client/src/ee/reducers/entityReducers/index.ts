export * from "ce/reducers/entityReducers";
import { entityReducerObject as CE_entityReducerObject } from "ce/reducers/entityReducers";
import { combineReducers } from "redux";
import packagesReducer from "./packagesReducer";
import modulesReducer from "./modulesReducer";
import moduleInstancesReducer from "./moduleInstancesReducer";
import moduleInstanceEntitiesReducer from "./moduleInstanceEntitiesReducer";

const entityReducer = combineReducers({
  ...CE_entityReducerObject,
  packages: packagesReducer,
  modules: modulesReducer,
  moduleInstances: moduleInstancesReducer,
  moduleInstanceEntities: moduleInstanceEntitiesReducer,
});

export default entityReducer;
