import { combineReducers } from "redux"
import canvasReducer from "./canvasReducer"
import widgetPaneReducer from "./widgetPaneReducer";

const uiReducer = combineReducers({ canvas: canvasReducer, widgetPane: widgetPaneReducer })
export default uiReducer
