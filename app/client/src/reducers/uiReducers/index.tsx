import { combineReducers } from "redux"
import canvasReducer from "./canvasReducer"
import widgetPaneReducer from "./widgetPaneReducer";

const uiReducer = combineReducers({ canvas: canvasReducer, componentPane: widgetPaneReducer })
export default uiReducer
