import { combineReducers } from "redux";
import canvasWidgetsReducer from "./canvasWidgetsReducer";
import apiDataReducer from "./apiDataReducer";
import queryDataReducer from "./queryDataReducer";
import widgetConfigReducer from "./widgetConfigReducer";
import actionsReducer from "./actionsReducer";
import propertyPaneConfigReducer from "./propertyPaneConfigReducer";
import resourceReducer from "./resourcesReducer";

const entityReducer = combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  apiData: apiDataReducer,
  queryData: queryDataReducer,
  widgetConfig: widgetConfigReducer,
  actions: actionsReducer,
  propertyConfig: propertyPaneConfigReducer,
  resources: resourceReducer,
});
export default entityReducer;
