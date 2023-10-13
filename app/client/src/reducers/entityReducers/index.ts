import { combineReducers } from "redux";
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
import autoHeightLayoutTreeReducer from "./autoHeightReducers/autoHeightLayoutTreeReducer";
import canvasLevelsReducer from "./autoHeightReducers/canvasLevelsReducer";
import actionsReducer from "@appsmith/reducers/entityReducers/actionsReducer";

/* Reducers which are integrated into the core system when registering a pluggable module
    or done so by a module that is designed to be eventually pluggable */
import widgetPositionsReducer from "layoutSystems/anvil/integrations/reducers/layoutElementPositionsReducer";

const entityReducer = combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  canvasWidgetsStructure: canvasWidgetsStructureReducer,
  metaWidgets: metaWidgetsReducer,
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
  widgetPositions: widgetPositionsReducer,
});

export default entityReducer;
