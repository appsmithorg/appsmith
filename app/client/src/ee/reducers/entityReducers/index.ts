export * from "ce/reducers/entityReducers";
import { entityReducerObject as CE_entityReducerObject } from "ce/reducers/entityReducers";
import { combineReducers } from "redux";
import packagesReducer from "./packagesReducer";
import workflowsReducer from "./workflowsReducer";
import modulesReducer from "./modulesReducer";
import moduleInstancesReducer from "./moduleInstancesReducer";
import moduleInstanceEntitiesReducer from "./moduleInstanceEntitiesReducer";

const entityReducer = combineReducers({
  ...CE_entityReducerObject,
  packages: packagesReducer,
  workflows: workflowsReducer,
  modules: modulesReducer,
  moduleInstances: moduleInstancesReducer,
  moduleInstanceEntities: moduleInstanceEntitiesReducer,
});

export default entityReducer;
