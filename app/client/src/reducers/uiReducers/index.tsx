import { combineReducers } from "redux"
import canvasReducer from "./canvasReducer"
import widgetPaneReducer from "./widgetPaneReducer"
import editorHeaderReducer from "./editorHeaderReducer"

const uiReducer = combineReducers({ canvas: canvasReducer, widgetPane: widgetPaneReducer, editorHeader: editorHeaderReducer })
export default uiReducer
