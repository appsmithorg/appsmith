import { combineReducers } from "redux";
import editorReducer from "./editorReducer";
import errorReducer from "./errorReducer";
import propertyPaneReducer from "./propertyPaneReducer";

const uiReducer = combineReducers({
  editor: editorReducer,
  errors: errorReducer,
  propertyPane: propertyPaneReducer,
});
export default uiReducer;
