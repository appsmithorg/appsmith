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
import metaReducer from "./metaReducer";
import actionDraftsReducer from "reducers/entityReducers/actionDraftsReducer";

const entityReducer = combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  queryData: queryDataReducer,
  widgetConfig: widgetConfigReducer,
  actions: actionsReducer,
  actionDrafts: actionDraftsReducer,
  propertyConfig: propertyPaneConfigReducer,
  datasources: datasourceReducer,
  pageList: pageListReducer,
  jsExecutions: jsExecutionsReducer,
  plugins: pluginsReducer,
  meta: metaReducer,
});

export default entityReducer;
