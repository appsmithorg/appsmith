import { combineReducers } from "redux";
import canvasWidgetsReducer from "./canvasWidgetsReducer";
import queryDataReducer from "./queryDataReducer";
import widgetConfigReducer from "./widgetConfigReducer";
import actionsReducer from "./actionsReducer";
import propertyPaneConfigReducer from "./propertyPaneConfigReducer";
import datasourceReducer from "./datasourceReducer";
import pageListReducer from "./pageListReducer";
import jsExecutionsReducer from "./jsExecutionsReducer";
import pluginsReducer from "reducers/entityReducers/pluginsReducer";

const entityReducer = combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  queryData: queryDataReducer,
  widgetConfig: widgetConfigReducer,
  actions: actionsReducer,
  propertyConfig: propertyPaneConfigReducer,
  datasources: datasourceReducer,
  pageList: pageListReducer,
  jsExecutions: jsExecutionsReducer,
  plugins: pluginsReducer,
});

export default entityReducer;
