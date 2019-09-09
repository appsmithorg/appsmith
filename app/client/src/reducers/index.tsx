import { combineReducers } from "redux";
import entityReducer from "./entityReducers";
import uiReducer from "./uiReducers";
import { CanvasReduxState } from "./uiReducers/canvasReducer";
import { CanvasWidgetsReduxState } from "./entityReducers/canvasWidgetsReducers";
import { WidgetCardsPaneReduxState } from "./uiReducers/widgetCardsPaneReducer";
import { EditorHeaderReduxState } from "./uiReducers/editorHeaderReducer";
import { EditorReduxState } from "./uiReducers/editorReducer";

const appReducer = combineReducers({
  entities: entityReducer,
  ui: uiReducer,
});

export default appReducer;

export interface AppState {
  ui: {
    canvas: CanvasReduxState;
    widgetCardsPane: WidgetCardsPaneReduxState;
    editorHeader: EditorHeaderReduxState;
    editor: EditorReduxState;
  };
  entities: {
    canvasWidgets: CanvasWidgetsReduxState;
  };
}
