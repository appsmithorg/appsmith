import { combineReducers } from "redux";
import canvasWidgetsReducer from "./canvasWidgetsReducers";

const entityReducer = combineReducers({ canvasWidgets: canvasWidgetsReducer });
export default entityReducer;
