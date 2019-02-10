import { combineReducers } from "redux"
import canvasReducer from "./canvasReducer"

const uiReducer = combineReducers({ canvas: canvasReducer })
export default uiReducer
