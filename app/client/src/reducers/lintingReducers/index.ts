import { combineReducers } from "redux";
import { lintErrorReducer } from "./lintErrorsReducers";

export default combineReducers({
  errors: lintErrorReducer,
});
