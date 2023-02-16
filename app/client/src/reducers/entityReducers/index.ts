import { combineReducers } from "redux";
import actionsReducer from "./actionsReducer";
import appReducer from "./appReducer";
import canvasWidgetsReducer from "./canvasWidgetsReducer";
import canvasWidgetsStructureReducer from "./canvasWidgetsStructureReducer";
import metaWidgetsReducer from "./metaWidgetsReducer";
import datasourceReducer from "./datasourceReducer";
import jsActionsReducer from "./jsActionsReducer";
import jsExecutionsReducer from "./jsExecutionsReducer";
import metaReducer from "./metaReducer";
import pageListReducer from "./pageListReducer";
import pluginsReducer from "reducers/entityReducers/pluginsReducer";
import widgetConfigReducer from "./widgetConfigReducer";
import autoHeightLayoutTreeReducer from "./autoHeightReducers/autoHeightLayoutTreeReducer";
import canvasLevelsReducer from "./autoHeightReducers/canvasLevelsReducer";

const entityReducer = combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  canvasWidgetsStructure: canvasWidgetsStructureReducer,
  metaWidgets: metaWidgetsReducer,
  widgetConfig: widgetConfigReducer,
  actions: actionsReducer,
  datasources: datasourceReducer,
  pageList: pageListReducer,
  jsExecutions: jsExecutionsReducer,
  plugins: pluginsReducer,
  meta: metaReducer,
  app: appReducer,
  jsActions: jsActionsReducer,
  autoHeightLayoutTree: autoHeightLayoutTreeReducer,
  canvasLevels: canvasLevelsReducer,
});

export default entityReducer;
