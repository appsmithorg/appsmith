import { combineReducers } from "redux";
import evaluatedTreeReducer from "./treeReducer";
import evaluationDependencyReducer from "./dependencyReducer";
import loadingEntitiesReducer from "./loadingEntitiesReducer";

export default combineReducers({
  tree: evaluatedTreeReducer,
  dependencies: evaluationDependencyReducer,
  loadingEntities: loadingEntitiesReducer,
});
