import { combineReducers } from "redux";

import evaluationDependencyReducer from "./dependencyReducer";
import formEvaluationReducer from "./formEvaluationReducer";
import loadingEntitiesReducer from "./loadingEntitiesReducer";
import evaluatedTreeReducer from "./treeReducer";
import triggerReducer from "./triggerReducer";

export default combineReducers({
  tree: evaluatedTreeReducer,
  dependencies: evaluationDependencyReducer,
  loadingEntities: loadingEntitiesReducer,
  formEvaluation: formEvaluationReducer,
  triggers: triggerReducer,
});
