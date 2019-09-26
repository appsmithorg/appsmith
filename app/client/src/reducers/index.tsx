import { combineReducers } from "redux";
import entityReducer from "./entityReducers";
import uiReducer from "./uiReducers";
import { CanvasWidgetsReduxState } from "./entityReducers/canvasWidgetsReducer";
import { WidgetCardsPaneReduxState } from "./uiReducers/widgetCardsPaneReducer";
import { EditorReduxState } from "./uiReducers/editorReducer";
import { APIDataState } from "./entityReducers/apiDataReducer";
import { QueryDataState } from "./entityReducers/queryDataReducer";
import { ActionDataState } from "./entityReducers/actionsReducer";
import { PropertyPaneConfigState } from "./entityReducers/propertyPaneConfigReducer";
import { PropertyPaneReduxState } from "./uiReducers/propertyPaneReducer";
import { WidgetConfigReducerState } from "./entityReducers/widgetConfigReducer";

const appReducer = combineReducers({
  entities: entityReducer,
  ui: uiReducer,
});

export default appReducer;

export interface AppState {
  ui: {
    widgetCardsPane: WidgetCardsPaneReduxState;
    editor: EditorReduxState;
    propertyPane: PropertyPaneReduxState;
  };
  entities: {
    canvasWidgets: CanvasWidgetsReduxState;
    apiData: APIDataState;
    queryData: QueryDataState;
    actions: ActionDataState;
    propertyConfig: PropertyPaneConfigState;
    widgetConfig: WidgetConfigReducerState;
  };
}
