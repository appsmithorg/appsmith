import { combineReducers } from "redux";
import canvasWidgetsReducer from "./canvasWidgetsReducer";

const entityReducer = combineReducers({ canvasWidgets: canvasWidgetsReducer });
export default entityReducer;
