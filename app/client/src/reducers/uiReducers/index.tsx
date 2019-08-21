import { combineReducers } from "redux"
import canvasReducer from "./canvasReducer"
import widgetCardsPaneReducer from "./widgetCardsPaneReducer"
import editorHeaderReducer from "./editorHeaderReducer"

const uiReducer = combineReducers({ canvas: canvasReducer, widgetCardsPane: widgetCardsPaneReducer, editorHeader: editorHeaderReducer })
export default uiReducer
