import { combineReducers } from "redux"
import entityReducer from "./entityReducers"
import uiReducer from "./uiReducers"
import { CanvasReduxState } from "./uiReducers/canvasReducer"
import { CanvasWidgetsReduxState } from "./entityReducers/canvasWidgetsReducers"
import { WidgetPaneReduxState } from "./uiReducers/widgetPaneReducer"

const appReducer = combineReducers({
  entities: entityReducer,
  ui: uiReducer
})

export default appReducer

export interface AppState {
  ui: {
    canvas: CanvasReduxState
    widgetPane: WidgetPaneReduxState
  }
  entities: {
    canvasWidgets: CanvasWidgetsReduxState
  }
}
