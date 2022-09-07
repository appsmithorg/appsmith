import { combineReducers } from "redux";
import actionsReducer from "./actionsReducer";
import appReducer from "./appReducer";
import canvasWidgetsReducer from "./canvasWidgetsReducer";
import canvasWidgetsStructureReducer from "./canvasWidgetsStructureReducer";
import datasourceReducer from "./datasourceReducer";
import jsActionsReducer from "./jsActionsReducer";
import jsExecutionsReducer from "./jsExecutionsReducer";
import metaReducer from "./metaReducer";
import dynamicHeightLayoutTreeReducer from "./dynamicHeightReducers/dynamicHeightLayoutTreeReducer";
import canvasLevelsReducer from "./dynamicHeightReducers/canvasLevelsReducer";
import pageListReducer from "./pageListReducer";
import pluginsReducer from "reducers/entityReducers/pluginsReducer";
import widgetConfigReducer from "./widgetConfigReducer";

const entityReducer = combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  canvasWidgetsStructure: canvasWidgetsStructureReducer,
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
