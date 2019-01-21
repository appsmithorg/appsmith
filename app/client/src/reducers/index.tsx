import { combineReducers } from "redux";
import entityReducer from "./entityReducers";
import uiReducer from "./uiReducers";

export default combineReducers({
  entities: entityReducer,
  ui: uiReducer
});
