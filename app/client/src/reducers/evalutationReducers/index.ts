import { combineReducers } from "redux";
import evaluatedTreeReducer from "./treeReducer";
import evaluationDependencyReducer from "./dependencyReducer";

export default combineReducers({
  tree: evaluatedTreeReducer,
  dependencies: evaluationDependencyReducer,
});
