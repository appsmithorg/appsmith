import { combineReducers } from "redux"
import entityReducer from "./entityReducers"
import uiReducer from "./uiReducers"
import { CanvasReduxState } from "./uiReducers/canvasReducer"
import { CanvasWidgetsReduxState } from "./entityReducers/canvasWidgetsReducers"
import { WidgetPaneReduxState } from "./uiReducers/widgetPaneReducer"
import { EditorHeaderReduxState } from "./uiReducers/editorHeaderReducer"

const appReducer = combineReducers({
  entities: entityReducer,
  ui: uiReducer
})

export default appReducer

export interface AppState {
  ui: {
    canvas: CanvasReduxState
    widgetPane: WidgetPaneReduxState
    editorHeader: EditorHeaderReduxState
  }
  entities: {
    canvasWidgets: CanvasWidgetsReduxState
  }
}
