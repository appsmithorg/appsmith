import { combineReducers } from "redux";
import canvasWidgetsReducer from "./canvasWidgetsReducer";
import widgetConfigReducer from "./widgetConfigReducer";
import actionsReducer from "./actionsReducer";
import datasourceReducer from "./datasourceReducer";
import pageListReducer from "./pageListReducer";
import jsExecutionsReducer from "./jsExecutionsReducer";
import pluginsReducer from "reducers/entityReducers/pluginsReducer";
import metaReducer from "./metaReducer";
import appReducer from "./appReducer";
import jsActionsReducer from "./jsActionsReducer";
import dynamicHeightLayoutTreeReducer from "./dynamicHeightReducers/dynamicHeightLayoutTreeReducer";
import canvasLevelsReducer from "./dynamicHeightReducers/canvasLevelsReducer";

const entityReducer = combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  widgetConfig: widgetConfigReducer,
  actions: actionsReducer,
  datasources: datasourceReducer,
  pageList: pageListReducer,
  jsExecutions: jsExecutionsReducer,
  plugins: pluginsReducer,
  meta: metaReducer,
  app: appReducer,
  jsActions: jsActionsReducer,
  dynamicHeightLayoutTree: dynamicHeightLayoutTreeReducer,
  canvasLevels: canvasLevelsReducer,
});

export default entityReducer;
