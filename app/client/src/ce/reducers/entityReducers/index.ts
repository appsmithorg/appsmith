import actionsReducer from "@appsmith/reducers/entityReducers/actionsReducer";
import appReducer from "reducers/entityReducers/appReducer";
import canvasWidgetsReducer from "reducers/entityReducers/canvasWidgetsReducer";
import canvasWidgetsStructureReducer from "reducers/entityReducers/canvasWidgetsStructureReducer";
import metaWidgetsReducer from "reducers/entityReducers/metaWidgetsReducer";
import datasourceReducer from "reducers/entityReducers/datasourceReducer";
import jsActionsReducer from "reducers/entityReducers/jsActionsReducer";
import jsExecutionsReducer from "reducers/entityReducers/jsExecutionsReducer";
import metaReducer from "reducers/entityReducers/metaReducer";
import pageListReducer from "reducers/entityReducers/pageListReducer";
import pluginsReducer from "reducers/entityReducers/pluginsReducer";
import autoHeightLayoutTreeReducer from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import canvasLevelsReducer from "reducers/entityReducers/autoHeightReducers/canvasLevelsReducer";

/* Reducers which are integrated into the core system when registering a pluggable module
    or done so by a module that is designed to be eventually pluggable */
import layoutElementPositionsReducer from "layoutSystems/anvil/integrations/reducers/layoutElementPositionsReducer";

export const entityReducerObject = {
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
  layoutElementPositions: layoutElementPositionsReducer,
};
