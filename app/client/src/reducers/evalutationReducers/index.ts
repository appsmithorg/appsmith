import { combineReducers } from "redux";
import evaluatedTreeReducer from "./treeReducer";

export default combineReducers({
  tree: evaluatedTreeReducer,
});
